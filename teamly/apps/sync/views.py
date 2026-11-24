import datetime
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.academic.models import Subject
from .ingestion import ingest_subject_assignments
from .models import AssignmentEvent, SyncCursor, SyncRun

# Sync slice: owns the sync status screen, runs, cursors and the feed.


@login_required
def sync_view(request):
    subjects = Subject.objects.filter(user=request.user).select_related("term")
    cursors = SyncCursor.objects.filter(subject__user=request.user).select_related("subject")
    cursor_map = {c.subject_id: c for c in cursors}

    runs = SyncRun.objects.filter(user=request.user).order_by("-started_at")[:10]
    events = (
        AssignmentEvent.objects.filter(user=request.user)
        .select_related("assignment")
        .order_by("-created_at")[:20]
    )

    # Attach cursor state to subjects for template display
    subjects_with_status = []
    for s in subjects:
        subjects_with_status.append(
            {
                "subject": s,
                "cursor": cursor_map.get(s.id),
            }
        )

    return render(
        request,
        "sync/sync.html",
        {
            "subjects_with_status": subjects_with_status,
            "runs": runs,
            "events": events,
        },
    )


@login_required
@require_POST
def sync_trigger_view(request):
    """
    Triggers an assignment ingestion run for the student's subjects.
    In Stage 1 foundation, it ingests structured external payloads through the ingestion seam.
    In Stage 2, it receives payloads from the Microsoft Graph API adapter.
    """
    subject_id = request.POST.get("subject_id")
    subjects = Subject.objects.filter(user=request.user)
    if subject_id:
        subjects = subjects.filter(pk=subject_id)

    total_created = 0
    total_updated = 0
    total_unchanged = 0

    for subj in subjects:
        sample_payload = [
            {
                "id": f"teams-{subj.teams_group_id}-milestone",
                "displayName": f"{subj.name} — Core Milestone Requirement",
                "instructions": {"content": f"Complete milestone tasks for {subj.name}."},
                "dueDateTime": (timezone.now() + datetime.timedelta(days=7)).isoformat(),
                "webUrl": f"https://teams.microsoft.com/l/assignment/{subj.teams_group_id}",
            }
        ]
        report = ingest_subject_assignments(
            user=request.user,
            subject=subj,
            raw_assignments=sample_payload,
            delta_token=f"delta-{subj.teams_group_id}-{int(timezone.now().timestamp())}",
        )
        total_created += report.created_count
        total_updated += report.updated_count
        total_unchanged += report.unchanged_count

    messages.success(
        request,
        f"Synchronization completed: {total_created} new, {total_updated} updated, {total_unchanged} unchanged.",
    )
    return redirect("sync:sync")

