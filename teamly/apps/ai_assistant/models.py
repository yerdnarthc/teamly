# teamly/apps/ai_assistant/models.py

from django.db import models


class AiSummary(models.Model):
    assignment = models.OneToOneField(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="ai_summary",
    )
    summary = models.TextField()
    requirements = models.JSONField(null=True, blank=True)
    deadlines = models.JSONField(null=True, blank=True)
    model = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_summary"

    def __str__(self):
        return f"Summary for {self.assignment.title}"


class AiFeedback(models.Model):
    class Rating(models.TextChoices):
        UP = "UP", "Helpful"
        DOWN = "DOWN", "Not helpful"

    ai_summary = models.ForeignKey(
        AiSummary, on_delete=models.CASCADE, related_name="feedback"
    )
    rating = models.CharField(max_length=10, choices=Rating.choices)
    corrected_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_feedback"

    def __str__(self):
        return f"Feedback ({self.rating}) on {self.ai_summary_id}"


class Subtask(models.Model):
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="subtasks",
    )
    title = models.CharField(max_length=200)
    is_done = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "subtask"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class PersonalNote(models.Model):
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="notes",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "personal_note"

    def __str__(self):
        return f"Note on {self.assignment.title}"


class Attachment(models.Model):
    class Kind(models.TextChoices):
        SPEC = "SPEC", "Specification"
        TEMPLATE = "TEMPLATE", "Template"
        RUBRIC = "RUBRIC", "Rubric"
        LINK = "LINK", "Link"

    class AddedBy(models.TextChoices):
        TEAMS = "TEAMS", "Microsoft Teams"
        USER = "USER", "User"

    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    label = models.CharField(max_length=120)
    url_or_drive_id = models.TextField()
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.LINK)
    added_by = models.CharField(
        max_length=10, choices=AddedBy.choices, default=AddedBy.USER
    )

    class Meta:
        db_table = "attachment"

    def __str__(self):
        return self.label


class DeadlineHistory(models.Model):
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="deadline_history",
    )
    old_due = models.DateTimeField(null=True, blank=True)
    new_due = models.DateTimeField(null=True, blank=True)
    detected_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=10, default="GRAPH")

    class Meta:
        db_table = "deadline_history"

    def __str__(self):
        return f"Deadline change on {self.assignment.title}"
