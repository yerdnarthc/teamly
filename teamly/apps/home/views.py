from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils import timezone

from apps.assignments.models import Assignment


@login_required
def home_view(request):
    """Assignment Dashboard: workload overview, statistics, and upcoming deadlines."""
    user = request.user
    now = timezone.now()

    user_assignments = Assignment.objects.filter(user=user)

    total_count = user_assignments.count()
    completed_count = user_assignments.filter(status__code="COMPLETED").count()
    active_count = user_assignments.exclude(status__code="COMPLETED").count()
    overdue_count = user_assignments.filter(due_at__lt=now).exclude(status__code="COMPLETED").count()

    upcoming_assignments = (
        user_assignments.filter(due_at__gte=now)
        .exclude(status__code="COMPLETED")
        .select_related("subject", "status", "priority")
        .order_by("due_at")[:5]
    )

    recent_assignments = (
        user_assignments.select_related("subject", "status", "priority")
        .order_by("-updated_at")[:4]
    )

    return render(
        request,
        "home/home.html",
        {
            "total_count": total_count,
            "completed_count": completed_count,
            "active_count": active_count,
            "overdue_count": overdue_count,
            "upcoming_assignments": upcoming_assignments,
            "recent_assignments": recent_assignments,
        },
    )
