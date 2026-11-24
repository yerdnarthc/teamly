# teamly/apps/sync/models.py

from django.conf import settings
from django.db import models


class SyncRun(models.Model):
    class Result(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        PARTIAL = "PARTIAL", "Partial"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sync_runs",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    new_count = models.IntegerField(default=0)
    updated_count = models.IntegerField(default=0)
    result = models.CharField(
        max_length=20, choices=Result.choices, default=Result.SUCCESS
    )

    class Meta:
        db_table = "sync_run"

    def __str__(self):
        return f"Sync {self.id} for {self.user.username} — {self.result}"


class SyncCursor(models.Model):
    subject = models.OneToOneField(
        "academic.Subject", on_delete=models.CASCADE, related_name="sync_cursor"
    )
    delta_link_ref = models.CharField(max_length=256, blank=True)
    last_ok_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)

    class Meta:
        db_table = "sync_cursor"

    def __str__(self):
        return f"Cursor for {self.subject.name}"


class AssignmentEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignment_events",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="events",
    )
    kind = models.CharField(max_length=24)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assignment_event"

    def __str__(self):
        return f"{self.kind} — {self.user.username}"
