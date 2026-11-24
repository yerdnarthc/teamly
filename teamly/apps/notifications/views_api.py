from rest_framework import generics, permissions

from .models import NotificationPreference
from .serializers import NotificationPreferenceSerializer


class ApiNotificationPreferenceView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer

    def get_object(self):
        pref, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return pref
