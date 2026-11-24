from rest_framework import serializers

from .models import NotificationPreference


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ("deadline_enabled", "lead_hours", "new_assignment")
