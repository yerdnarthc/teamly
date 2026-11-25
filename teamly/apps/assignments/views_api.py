from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_assistant.advisor import adopt_suggested_subtask
from apps.notifications.services import schedule_deadline_reminder
from .models import Assignment, Subtask
from .serializers import (
    AssignmentCreateUpdateSerializer,
    AssignmentDetailSerializer,
    AssignmentListSerializer,
    SubtaskSerializer,
)


class AssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        params = self.request.query_params
        return (
            Assignment.objects.for_user(self.request.user)
            .select_related("status", "priority", "subject")
            .prefetch_related("subtasks")
            .filter_by_params(
                upcoming=params.get("upcoming") == "true",
                search_query=params.get("q") or params.get("search") or "",
                status_code=params.get("status"),
                subject_id=params.get("subject"),
                priority_code=params.get("priority"),
            )
        )

    def get_serializer_class(self):
        if self.action == "list":
            return AssignmentListSerializer
        elif self.action == "retrieve":
            return AssignmentDetailSerializer
        return AssignmentCreateUpdateSerializer

    def perform_create(self, serializer):
        assignment = serializer.save()
        schedule_deadline_reminder(assignment)

    def perform_update(self, serializer):
        assignment = serializer.save()
        schedule_deadline_reminder(assignment)

    @action(detail=False, methods=["get"], url_path="metrics")
    def metrics(self, request):
        """
        Consolidated workload metrics for student mobile dashboard:
        total, active, completed, and overdue counts.
        """
        metrics = Assignment.objects.for_user(request.user).workload_metrics()
        return Response(
            {
                "total_count": metrics["total_count"],
                "completed_count": metrics["completed_count"],
                "active_count": metrics["active_count"],
                "overdue_count": metrics["overdue_count"],
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="adopt-subtask")
    def adopt_subtask(self, request, pk=None):
        """
        Deep Seam: Adopts an individual AI-generated suggested subtask
        and converts it into an authoritative student Subtask checklist record.
        """
        assignment = self.get_object()
        title = request.data.get("title", "").strip()
        if not title:
            return Response(
                {"error": "Title is required to adopt a subtask."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subtask = adopt_suggested_subtask(assignment=assignment, suggestion_title=title)
        return Response(SubtaskSerializer(subtask).data, status=status.HTTP_201_CREATED)


class SubtaskToggleApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        """
        Toggles the completion status of a subtask.
        Ensures user can only toggle subtasks belonging to their own assignments.
        """
        subtask = get_object_or_404(
            Subtask.objects.select_related("assignment"),
            id=pk,
            assignment__user=request.user,
        )
        subtask.is_done = not subtask.is_done
        subtask.save(update_fields=["is_done"])
        return Response(SubtaskSerializer(subtask).data, status=status.HTTP_200_OK)
