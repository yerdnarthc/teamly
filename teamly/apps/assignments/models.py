# teamly/apps/assignments/models.py

from django.conf import settings
from django.db import models


class Status(models.Model):
    code = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=40)

    class Meta:
        db_table = "status"

    def __str__(self):
        return self.label


class Priority(models.Model):
    code = models.CharField(max_length=20, unique=True)
    rank = models.IntegerField()

    class Meta:
        db_table = "priority"

    def __str__(self):
        return self.code


class Tag(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tags",
    )
    name = models.CharField(max_length=40)

    class Meta:
        db_table = "tag"
        unique_together = [("user", "name")]

    def __str__(self):
        return self.name


class Assignment(models.Model):
    class Source(models.TextChoices):
        TEAMS = "TEAMS", "Microsoft Teams"
        MANUAL = "MANUAL", "Manual entry"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    # SET_NULL: deleting a subject keeps the student's assignments.
    subject = models.ForeignKey(
        "academic.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments",
    )
    status = models.ForeignKey(
        Status, on_delete=models.PROTECT, related_name="assignments"
    )
    priority = models.ForeignKey(
        Priority, on_delete=models.PROTECT, related_name="assignments"
    )
    title = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(
        max_length=10, choices=Source.choices, default=Source.MANUAL
    )
    teams_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    teams_url = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, through="AssignmentTag", related_name="assignments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assignment"

    def __str__(self):
        return self.title


class AssignmentTag(models.Model):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="assignment_tags"
    )
    tag = models.ForeignKey(
        Tag, on_delete=models.CASCADE, related_name="assignment_tags"
    )

    class Meta:
        db_table = "assignment_tag"
        unique_together = [("assignment", "tag")]

    def __str__(self):
        return f"{self.assignment.title} / {self.tag.name}"
