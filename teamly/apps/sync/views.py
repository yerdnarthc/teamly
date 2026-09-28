from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import AssignmentEvent, SyncRun

# Sync slice: owns the sync status screen, runs, cursors and the feed.


@login_required
def sync_view(request):
    runs = SyncRun.objects.filter(user=request.user).order_by("-started_at")[:10]
    events = AssignmentEvent.objects.filter(user=request.user).order_by(
        "-created_at"
    )[:20]
    return render(request, "sync/sync.html", {"runs": runs, "events": events})
