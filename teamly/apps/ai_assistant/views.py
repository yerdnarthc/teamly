from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import AiSummary

# AI slice: owns the assistant screen; AI rows are assistive only and
# never replace the Teams source assignment.


@login_required
def assistant_view(request):
    summaries = AiSummary.objects.filter(
        assignment__user=request.user
    ).select_related("assignment")
    return render(
        request,
        "ai_assistant/assistant.html",
        {"summaries": summaries},
    )
