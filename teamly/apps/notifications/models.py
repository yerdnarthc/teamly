# teamly/apps/notifications/models.py

from django.conf import settings
from django.db import models


class Reminder(models.Model):
    class Channel(models.TextChoices):
        IN_APP = "IN_APP", "In app"
        EMAIL = "EMAIL", "Email"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    remind_at = models.DateTimeField()
    channel = models.CharField(
        max_length=10, choices=Channel.choices, default=Channel.IN_APP
    )
    is_sent = models.BooleanField(default=False)

    class Meta:
        db_table = "reminder"

    def __str__(self):
        return f"Reminder for {self.assignment.title} at {self.remind_at}"


class NotificationLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_logs",
    )
    kind = models.CharField(max_length=20)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification_log"

    def __str__(self):
        return f"{self.kind} to {self.user.username}"
