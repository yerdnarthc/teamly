from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import Assignment

# Assignments slice: owns the assignment list screen and core data.


@login_required
def assignments_view(request):
    assignments = (
        Assignment.objects.filter(user=request.user)
        .select_related("subject", "status", "priority")
        .order_by("due_at")
    )
    return render(
        request,
        "assignments/assignments.html",
        {"assignments": assignments},
    )
