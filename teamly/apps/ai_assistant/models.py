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
    suggested_subtasks = models.JSONField(null=True, blank=True, default=list)
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
