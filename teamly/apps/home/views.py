from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from apps.assignments.models import Assignment


@login_required
def home_view(request):
    """Assignment Dashboard: workload overview, statistics, and upcoming deadlines."""
    metrics = Assignment.objects.for_user(request.user).workload_metrics()
    return render(request, "home/home.html", metrics)
