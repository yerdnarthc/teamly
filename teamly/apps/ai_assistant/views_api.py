from rest_framework import permissions, serializers, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assignments.models import Assignment
from apps.assignments.serializers import PrioritySerializer, StatusSerializer, SubjectBriefSerializer
from .advisor import (
    analyze_assignment,
    analyze_pending_assignments,
    build_workspace_insights,
    estimate_assignment_study_profile,
)
from .models import AiFeedback, AiSummary


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
    adopted_titles = [s.title.lower().strip() for s in assignment.subtasks.all()]
    latest_feedback = summary.feedback.order_by("-created_at").first()

    return {
        "id": summary.id,
        "assignment": WorkspaceAssignmentBriefSerializer(assignment).data,
        "summary": summary.summary,
        "requirements": summary.requirements or [],
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
        summaries = list(
            AiSummary.objects.filter(assignment__user=request.user)
            .select_related("assignment", "assignment__subject", "assignment__status", "assignment__priority")
            .prefetch_related("assignment__subtasks", "feedback")
            .order_by("-assignment__priority__rank", "assignment__due_at", "-created_at")
        )
        summaries_with_profiles = [
            (s, estimate_assignment_study_profile(s.assignment, s)) for s in summaries
        ]

        unanalyzed = list(
            Assignment.objects.filter(user=request.user)
            .exclude(status__code="COMPLETED")
            .filter(ai_summary__isnull=True)
            .select_related("subject", "priority", "status")
            .prefetch_related("subtasks")
            .order_by("-priority__rank", "due_at")
        )

        insights = build_workspace_insights(summaries_with_profiles, len(unanalyzed))

        return Response(
            {
                "workspace_insights": insights,
                "summaries": [
                    serialize_workspace_summary(summary, profile)
                    for summary, profile in summaries_with_profiles
                ],
                "unanalyzed_assignments": WorkspaceAssignmentBriefSerializer(
                    unanalyzed, many=True
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
        rating = request.data.get("rating")
        if rating not in AiFeedback.Rating.values:
            return Response(
                {"error": f"Invalid rating. Choose from {AiFeedback.Rating.values}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feedback = AiFeedback.objects.create(
            ai_summary=summary,
            rating=rating,
            corrected_text=request.data.get("corrected_text", ""),
        )
        return Response(
            {
                "id": feedback.id,
                "rating": feedback.rating,
                "created_at": feedback.created_at,
            },
            status=status.HTTP_201_CREATED,
        )
