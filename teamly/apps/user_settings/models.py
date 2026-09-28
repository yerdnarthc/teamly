# teamly/apps/user_settings/models.py

from django.conf import settings
from django.db import models

# Settings slice: owns user preferences. Separate from Profile so each
# business capability keeps its own data and screen.


class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_settings")
    dark_mode = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)

    class Meta:
        db_table = "user_settings"

    def __str__(self):
        return f"Settings for {self.user.username}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preference")
    new_assignment = models.BooleanField(default=True)
    deadline_enabled = models.BooleanField(default=True)
    lead_hours = models.IntegerField(default=24)

    class Meta:
        db_table = "notification_preference"

    def __str__(self):
        return f"Notification preference for {self.user.username}"
