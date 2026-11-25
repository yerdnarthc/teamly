import datetime
from django.utils import timezone

from apps.academic.models import Subject
from apps.assignments.querysets import serialize_assignment_brief
from .ingestion import ingest_subject_assignments
from .models import AssignmentEvent, SyncCursor, SyncRun


def sync_demo_teams_for_user(user) -> dict:
    """
    Runs demo Microsoft Teams assignment ingestion across all subjects owned by `user`
    and returns aggregated counts plus a human-readable summary message.
    """
    subjects = Subject.objects.filter(user=user)
    total_created = 0
    total_updated = 0
    total_unchanged = 0
    total_events = 0

    stable_due = (timezone.now() + datetime.timedelta(days=7)).replace(
        minute=0, second=0, microsecond=0
    )

    for subj in subjects:
        sample_payload = [
            {
                "id": f"teams-{subj.teams_group_id}-milestone",
                "displayName": f"{subj.name} — Core Milestone Requirement",
                "instructions": {"content": f"Complete milestone tasks for {subj.name}."},
                "dueDateTime": stable_due.isoformat(),
                "webUrl": f"https://teams.microsoft.com/l/assignment/{subj.teams_group_id}",
            }
        ]
        report = ingest_subject_assignments(
            user=user,
            subject=subj,
            raw_assignments=sample_payload,
            delta_token=f"delta-{subj.teams_group_id}-{int(timezone.now().timestamp())}",
        )
        total_created += report.created_count
        total_updated += report.updated_count
        total_unchanged += report.unchanged_count
        total_events += report.events_emitted

    message = (
        f"Synced {subjects.count()} class(es): {total_created} new, "
        f"{total_updated} updated, {total_unchanged} up-to-date."
    )
    return {
        "created_count": total_created,
        "updated_count": total_updated,
        "unchanged_count": total_unchanged,
        "events_emitted": total_events,
        "message": message,
    }


def get_sync_diagnostics(user) -> dict:
    """
    Returns sync diagnostics for `user`: subject delta cursors,
    recent SyncRuns, and chronological AssignmentEvents.
    """
    subjects = Subject.objects.filter(user=user).order_by("name")
    cursor_map = {
        c.subject_id: c
        for c in SyncCursor.objects.filter(subject__user=user).select_related("subject")
    }

    cursors = [
        {
            "subject_id": subj.id,
            "subject_name": subj.name,
            "subject_color": subj.color,
            "last_ok_at": cursor.last_ok_at if cursor else None,
            "last_error": cursor.last_error if cursor else "",
            "has_delta_token": bool(cursor and cursor.delta_link_ref),
        }
        for subj in subjects
        for cursor in [cursor_map.get(subj.id)]
    ]

    runs_qs = SyncRun.objects.filter(user=user).order_by("-started_at")
    total_runs = runs_qs.count()
    runs = [
        {
            "id": run.id,
            "started_at": run.started_at,
            "finished_at": run.finished_at,
            "new_count": run.new_count,
            "updated_count": run.updated_count,
            "result": run.result,
        }
        for run in runs_qs[:15]
    ]

    events_qs = (
        AssignmentEvent.objects.filter(user=user)
        .select_related("assignment", "assignment__subject")
        .order_by("-created_at")
    )
    total_events = events_qs.count()
    events = [
        {
            "id": evt.id,
            "kind": evt.kind,
            "created_at": evt.created_at,
            "assignment": serialize_assignment_brief(evt.assignment, include_due_at=False),
        }
        for evt in events_qs[:30]
    ]

    return {
        "summary": {
            "total_runs": total_runs,
            "total_events": total_events,
            "last_sync_at": runs[0]["started_at"] if runs else None,
        },
        "cursors": cursors,
        "runs": runs,
        "events": events,
    }
