from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .forms import AssignmentForm
from .models import Assignment, Priority, Status


@login_required
def assignments_view(request):
    """Lists assignments for the authenticated student with optional status filtering."""
    status_filter = request.GET.get("status", "").strip()
    search_query = request.GET.get("q", "").strip()

    qs = (
        Assignment.objects.filter(user=request.user)
        .select_related("subject", "status", "priority")
        .order_by("due_at")
    )

    if status_filter:
        qs = qs.filter(status__code=status_filter)
    if search_query:
        qs = qs.filter(Q(title__icontains=search_query) | Q(instructions__icontains=search_query))

    statuses = Status.objects.all()
    priorities = Priority.objects.all()

    return render(
        request,
        "assignments/assignments.html",
        {
            "assignments": qs,
            "statuses": statuses,
            "priorities": priorities,
            "active_status": status_filter,
            "search_query": search_query,
        },
    )


@login_required
def assignment_create_view(request):
    """Allows manual creation of a new academic assignment."""
    if request.method == "POST":
        form = AssignmentForm(request.POST, user=request.user)
        if form.is_valid():
            assignment = form.save(commit=False)
            assignment.user = request.user
            assignment.source = Assignment.Source.MANUAL
            assignment.save()
            return redirect("assignments:list")
    else:
        form = AssignmentForm(user=request.user)

    return render(request, "assignments/assignment_create.html", {"form": form})


@login_required
def assignment_detail_view(request, pk):
    """Displays detailed instructions, requirements, and metadata for a specific assignment."""
    assignment = get_object_or_404(
        Assignment.objects.select_related("subject", "status", "priority"),
        pk=pk,
        user=request.user,
    )
    statuses = Status.objects.all()
    return render(
        request,
        "assignments/assignment_detail.html",
        {"assignment": assignment, "statuses": statuses},
    )


@login_required
@require_POST
def assignment_update_status_view(request, pk):
    """Quickly updates the status of an assignment (e.g. from Detail or List)."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    status_code = request.POST.get("status_code")
    if status_code:
        new_status = get_object_or_404(Status, code=status_code)
        assignment.status = new_status
        assignment.save(update_fields=["status", "updated_at"])
    return redirect("assignments:detail", pk=assignment.pk)


@login_required
@require_POST
def assignment_delete_view(request, pk):
    """Deletes an assignment belonging to the authenticated student."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    assignment.delete()
    return redirect("assignments:list")
