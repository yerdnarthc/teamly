from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NotificationPreference
from .serializers import NotificationPreferenceSerializer
from .services import (
    dismiss_user_reminder,
    get_notification_history,
    reschedule_user_reminders,
)


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
        payload = get_notification_history(request.user)
        return Response(payload, status=status.HTTP_200_OK)


class ReminderDismissApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        """Dismisses/cancels a scheduled reminder owned by the authenticated user."""
        if not dismiss_user_reminder(request.user, pk):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
