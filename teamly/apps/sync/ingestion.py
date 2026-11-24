import datetime
import re
from dataclasses import dataclass, field

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.assignments.models import Assignment, Priority, Status
from apps.notifications.services import schedule_deadline_reminder
from .models import AssignmentEvent, SyncCursor, SyncRun


@dataclass(frozen=True)
class SyncReport:
    """
    Structured, immutable summary of an assignment ingestion run.
    """
    created_count: int = 0
    updated_count: int = 0
    unchanged_count: int = 0
    events_emitted: int = 0
    errors: tuple[str, ...] = ()


def _extract_instructions(raw_instructions) -> str:
    """Extracts clean text content from instructions (string or Microsoft Graph dict)."""
    if isinstance(raw_instructions, dict):
        raw_instructions = raw_instructions.get("content", "")
    if not raw_instructions:
        return ""
    # Strip HTML tags if content is HTML-formatted
    cleaned = re.sub(r"<[^>]+>", "", str(raw_instructions)).strip()
    return cleaned or str(raw_instructions).strip()


def _parse_due_date(raw_due) -> datetime.datetime | None:
    """Parses an ISO format datetime string into a timezone-aware datetime."""
    if not raw_due:
        return None
    if isinstance(raw_due, datetime.datetime):
        dt = raw_due
    else:
        dt = parse_datetime(str(raw_due))
    if dt and timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def ingest_subject_assignments(
    user,
    subject,
    raw_assignments: list[dict],
    delta_token: str = "",
    now: datetime.datetime | None = None,
) -> SyncReport:
    """
    Ingests external Microsoft Teams assignment payloads for an academic subject.
    
    Invariants enforced:
    1. Deduplication via `teams_id`.
    2. External source data is updated, but student-managed state (status, priority,
       personal notes, subtasks, tags) is strictly preserved.
    3. Deadline changes automatically re-align scheduled notification reminders.
    4. Updates SyncCursor and logs a completed SyncRun atomically.
    """
    if now is None:
        now = timezone.now()

    created_count = 0
    updated_count = 0
    unchanged_count = 0
    events_emitted = 0
    errors: list[str] = []

    # Ensure default status and priority exist
    default_status, _ = Status.objects.get_or_create(
        code="NOT_STARTED", defaults={"label": "Not Started"}
    )
    default_priority, _ = Priority.objects.get_or_create(
        code="MEDIUM", defaults={"rank": 2}
    )

    with transaction.atomic():
        for item in raw_assignments:
            teams_id = item.get("id")
            if not teams_id:
                errors.append(f"Assignment item missing 'id': {item}")
                continue

            title = item.get("displayName") or item.get("title") or "Untitled Assignment"
            instructions = _extract_instructions(item.get("instructions", ""))
            due_at = _parse_due_date(item.get("dueDateTime") or item.get("due_at"))
            teams_url = item.get("webUrl") or item.get("teams_url") or ""

            assignment = Assignment.objects.filter(teams_id=teams_id).first()

            if assignment is None:
                # 1. New Assignment detected
                assignment = Assignment.objects.create(
                    user=user,
                    subject=subject,
                    title=title,
                    instructions=instructions,
                    due_at=due_at,
                    source=Assignment.Source.TEAMS,
                    teams_id=teams_id,
                    teams_url=teams_url,
                    status=default_status,
                    priority=default_priority,
                )
                created_count += 1

                AssignmentEvent.objects.create(
                    user=user,
                    assignment=assignment,
                    kind="ASSIGNMENT_CREATED",
                )
                events_emitted += 1

                # Schedule initial deadline reminder per student preference
                schedule_deadline_reminder(assignment)

            else:
                # 2. Existing Assignment: reconcile external source data
                changed = False
                deadline_shifted = False

                if assignment.title != title:
                    assignment.title = title
                    changed = True

                if assignment.instructions != instructions:
                    assignment.instructions = instructions
                    changed = True

                if assignment.due_at != due_at:
                    assignment.due_at = due_at
                    changed = True
                    deadline_shifted = True

                if assignment.teams_url != teams_url:
                    assignment.teams_url = teams_url
                    changed = True

                if assignment.subject_id != subject.id:
                    assignment.subject = subject
                    changed = True

                if changed:
                    # Note: status, priority, subtasks, notes, tags are UNTOUCHED
                    assignment.save(
                        update_fields=[
                            "title",
                            "instructions",
                            "due_at",
                            "teams_url",
                            "subject",
                            "updated_at",
                        ]
                    )
                    updated_count += 1

                    AssignmentEvent.objects.create(
                        user=user,
                        assignment=assignment,
                        kind="ASSIGNMENT_UPDATED",
                    )
                    events_emitted += 1

                    if deadline_shifted:
                        schedule_deadline_reminder(assignment)
                else:
                    unchanged_count += 1

        # 3. Update SyncCursor for subject
        cursor, _ = SyncCursor.objects.get_or_create(subject=subject)
        cursor.last_ok_at = now
        if delta_token:
            cursor.delta_link_ref = delta_token
        cursor.last_error = ""
        cursor.save()

        # 4. Record SyncRun
        SyncRun.objects.create(
            user=user,
            started_at=now,
            finished_at=now,
            new_count=created_count,
            updated_count=updated_count,
            result=SyncRun.Result.SUCCESS,
        )

    return SyncReport(
        created_count=created_count,
        updated_count=updated_count,
        unchanged_count=unchanged_count,
        events_emitted=events_emitted,
        errors=tuple(errors),
    )
