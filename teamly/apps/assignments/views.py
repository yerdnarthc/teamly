from django.contrib.auth.decorators import login_required
from django.db.models import Q, Subquery
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .forms import AssignmentForm
from .models import Assignment, Attachment, PersonalNote, Priority, Status, Subtask


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
        Assignment.objects.select_related("subject", "status", "priority").prefetch_related(
            "subtasks", "notes", "attachments"
        ),
        pk=pk,
        user=request.user,
    )
    statuses = Status.objects.all()
    try:
        ai_summary = assignment.ai_summary
    except Exception:
        ai_summary = None
    existing_subtask_titles = {s.title.strip() for s in assignment.subtasks.all()}
    return render(
        request,
        "assignments/assignment_detail.html",
        {
            "assignment": assignment,
            "statuses": statuses,
            "ai_summary": ai_summary,
            "existing_subtask_titles": existing_subtask_titles,
        },
    )


@login_required
@require_POST
def assignment_add_subtask_view(request, pk):
    """Adds a student-managed checklist subtask to the assignment."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    title = request.POST.get("title", "").strip()
    if title:
        Subtask.objects.create(assignment=assignment, title=title)
    return redirect("assignments:detail", pk=assignment.pk)


@login_required
@require_POST
def assignment_toggle_subtask_view(request, pk, subtask_pk):
    """Toggles completion state of a student subtask."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    subtask = get_object_or_404(Subtask, pk=subtask_pk, assignment=assignment)
    subtask.is_done = not subtask.is_done
    subtask.save(update_fields=["is_done"])
    return redirect("assignments:detail", pk=assignment.pk)


@login_required
@require_POST
def assignment_add_note_view(request, pk):
    """Adds a timestamped personal note to the assignment."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    body = request.POST.get("body", "").strip()
    if body:
        PersonalNote.objects.create(assignment=assignment, body=body)
    return redirect("assignments:detail", pk=assignment.pk)


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


@login_required
def sql_showcase_view(request):
    """
    Demonstrates SQL JOIN and SQL SUBQUERY operations using Django ORM and Supabase PostgreSQL.
    Part 1: JOIN retrieving assignments together with related subject, status, and priority.
    Part 2: SUBQUERY filtering assignments that have unfinished checklist subtasks (is_done=False).
    """
    # 1. SQL JOIN Implementation
    # Combines assignment records with related subject and status records via ForeignKeys.
    joined_assignments = (
        Assignment.objects.filter(user=request.user)
        .select_related("subject", "status", "priority")
        .order_by("due_at")
    )
    join_sql = str(joined_assignments.query)

    # 2. SQL SUBQUERY Implementation
    # Inner Query: Select assignment IDs that have uncompleted subtasks (is_done=False)
    pending_subtasks = Subtask.objects.filter(is_done=False).values("assignment_id")

    # Outer Query: Select assignments belonging to the student where ID is in the inner subquery
    subquery_assignments = (
        Assignment.objects.filter(
            id__in=Subquery(pending_subtasks),
            user=request.user,
        )
        .select_related("subject", "status", "priority")
        .order_by("due_at")
    )
    subquery_sql = str(subquery_assignments.query)

    # Print queries to console for terminal inspection during demo
    print("\n" + "=" * 60)
    print("[SQL DEMO] 1. GENERATED JOIN SQL:")
    print(join_sql)
    print("\n[SQL DEMO] 2. GENERATED SUBQUERY SQL:")
    print(subquery_sql)
    print("=" * 60 + "\n")

    return render(
        request,
        "assignments/sql_showcase.html",
        {
            "joined_assignments": joined_assignments,
            "join_sql": join_sql,
            "subquery_assignments": subquery_assignments,
            "subquery_sql": subquery_sql,
        },
    )

