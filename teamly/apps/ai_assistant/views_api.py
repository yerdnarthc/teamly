from rest_framework import permissions, serializers, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assignments.models import Assignment
from apps.assignments.serializers import PrioritySerializer, StatusSerializer, SubjectBriefSerializer
from .advisor import (
    analyze_assignment,
    analyze_pending_assignments,
    estimate_assignment_study_profile,
    get_adopted_subtask_titles,
    get_assistant_workspace,
    record_ai_feedback,
)
from .models import AiSummary


class WorkspaceAssignmentBriefSerializer(serializers.ModelSerializer):
    status = StatusSerializer(read_only=True)
    priority = PrioritySerializer(read_only=True)
    subject = SubjectBriefSerializer(read_only=True)
    subtask_count = serializers.IntegerField(source="subtasks.count", read_only=True)
    completed_subtask_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "due_at",
            "status",
            "priority",
            "subject",
            "subtask_count",
            "completed_subtask_count",
        )

    def get_completed_subtask_count(self, obj) -> int:
        return sum(1 for s in obj.subtasks.all() if s.is_done)


def serialize_workspace_summary(summary: AiSummary, profile: dict) -> dict:
    assignment = summary.assignment
    adopted_titles = get_adopted_subtask_titles(assignment)
    latest_feedback = summary.feedback.order_by("-created_at").first()

    return {
        "id": summary.id,
        "assignment": WorkspaceAssignmentBriefSerializer(assignment).data,
        "summary": summary.summary,
        "requirements": summary.requirements or [],
        "deadlines": summary.deadlines or [],
        "suggested_subtasks": summary.suggested_subtasks or [],
        "adopted_titles": adopted_titles,
        "complexity": profile["complexity"],
        "estimated_minutes": profile["estimated_minutes"],
        "study_tip": profile["study_tip"],
        "model": summary.model,
        "user_rating": latest_feedback.rating if latest_feedback else None,
        "created_at": summary.created_at,
    }


class AssistantWorkspaceApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        workspace = get_assistant_workspace(request.user)
        return Response(
            {
                "workspace_insights": workspace["workspace_insights"],
                "summaries": [
                    serialize_workspace_summary(summary, profile)
                    for summary, profile in workspace["summaries_with_profiles"]
                ],
                "unanalyzed_assignments": WorkspaceAssignmentBriefSerializer(
                    workspace["unanalyzed"], many=True
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class AssistantAnalyzeApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, assignment_id):
        assignment = get_object_or_404(
            Assignment.objects.select_related("subject", "status", "priority").prefetch_related("subtasks"),
            id=assignment_id,
            user=request.user,
        )
        summary = analyze_assignment(assignment)
        profile = estimate_assignment_study_profile(assignment, summary)
        return Response(
            serialize_workspace_summary(summary, profile),
            status=status.HTTP_201_CREATED,
        )


class AssistantAnalyzeAllApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        created = analyze_pending_assignments(request.user)
        return Response(
            {
                "analyzed_count": len(created),
                "message": f"Generated AI study breakdowns for {len(created)} assignment(s).",
            },
            status=status.HTTP_200_OK,
        )


class AssistantFeedbackApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        summary = get_object_or_404(
            AiSummary, id=pk, assignment__user=request.user
        )
        try:
            feedback = record_ai_feedback(summary, request.data.get("rating"))
        except ValueError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": feedback.id,
                "rating": feedback.rating,
                "created_at": feedback.created_at,
            },
            status=status.HTTP_201_CREATED,
        )
