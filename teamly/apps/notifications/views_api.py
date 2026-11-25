from rest_framework import generics, permissions, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NotificationLog, NotificationPreference, Reminder
from .serializers import NotificationPreferenceSerializer
from .services import reschedule_user_reminders


def _serialize_assignment_brief(assignment):
    if assignment is None:
        return None
    return {
        "id": assignment.id,
        "title": assignment.title,
        "due_at": assignment.due_at,
        "subject_name": assignment.subject.name if assignment.subject else None,
        "subject_color": assignment.subject.color if assignment.subject else None,
    }


class ApiNotificationPreferenceView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer

    def get_object(self):
        pref, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return pref

    def perform_update(self, serializer):
        serializer.save()
        reschedule_user_reminders(self.request.user)


class NotificationHistoryApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Returns scheduled upcoming reminders and historical notification delivery logs
        scoped to the authenticated student.
        """
        user = request.user
        pref, _ = NotificationPreference.objects.get_or_create(user=user)

        reminders_qs = (
            Reminder.objects.filter(user=user, is_sent=False)
            .select_related("assignment", "assignment__subject")
            .order_by("remind_at")
        )
        pending_count = reminders_qs.count()
        reminders = [
            {
                "id": r.id,
                "remind_at": r.remind_at,
                "channel": r.channel,
                "is_sent": r.is_sent,
                "assignment": _serialize_assignment_brief(r.assignment),
            }
            for r in reminders_qs[:30]
        ]

        logs_qs = (
            NotificationLog.objects.filter(user=user)
            .select_related("assignment", "assignment__subject")
            .order_by("-sent_at")
        )
        delivered_count = logs_qs.count()
        logs = [
            {
                "id": log.id,
                "kind": log.kind,
                "sent_at": log.sent_at,
                "assignment": _serialize_assignment_brief(log.assignment),
            }
            for log in logs_qs[:30]
        ]

        return Response(
            {
                "summary": {
                    "pending_count": pending_count,
                    "delivered_count": delivered_count,
                    "deadline_enabled": pref.deadline_enabled,
                    "lead_hours": pref.lead_hours,
                    "new_assignment": pref.new_assignment,
                },
                "reminders": reminders,
                "logs": logs,
            },
            status=status.HTTP_200_OK,
        )


class ReminderDismissApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        """Dismisses/cancels a scheduled reminder owned by the authenticated user."""
        reminder = get_object_or_404(Reminder, id=pk, user=request.user)
        reminder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
