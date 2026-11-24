from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.assignments.models import Assignment
from .advisor import adopt_suggested_subtask, analyze_assignment
from .models import AiFeedback, AiSummary


@login_required
def assistant_view(request):
    """Overview screen of all AI assignment summaries."""
    summaries = AiSummary.objects.filter(
        assignment__user=request.user
    ).select_related("assignment")
    return render(
        request,
        "ai_assistant/assistant.html",
        {"summaries": summaries},
    )


@login_required
@require_POST
def analyze_view(request, pk):
    """Generates or refreshes the AI summary and task breakdown for an assignment."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    analyze_assignment(assignment)
    messages.success(request, "AI analysis and task breakdown generated successfully.")
    return redirect("assignments:detail", pk=assignment.pk)


@login_required
@require_POST
def adopt_subtask_view(request, pk):
    """Adoption seam: explicitly converts an individual AI suggestion into a student Subtask."""
    assignment = get_object_or_404(Assignment, pk=pk, user=request.user)
    title = request.POST.get("title", "").strip()
    if title:
        adopt_suggested_subtask(assignment, title)
        messages.success(request, f"Adopted '{title}' into your personal checklist.")
    return redirect("assignments:detail", pk=assignment.pk)


@login_required
@require_POST
def feedback_view(request, pk):
    """Records helpful/not helpful feedback on an AI summary."""
    summary = get_object_or_404(AiSummary, pk=pk, assignment__user=request.user)
    rating = request.POST.get("rating")
    if rating in AiFeedback.Rating.values:
        AiFeedback.objects.create(ai_summary=summary, rating=rating)
        messages.success(request, "Feedback recorded. Thank you!")
    return redirect("assignments:detail", pk=summary.assignment_id)
