from django.contrib import admin

from .models import (
    AiFeedback,
    AiSummary,
    DeadlineHistory,
)


@admin.register(AiSummary)
class AiSummaryAdmin(admin.ModelAdmin):
    list_display = ("assignment", "model", "created_at")


@admin.register(AiFeedback)
class AiFeedbackAdmin(admin.ModelAdmin):
    list_display = ("ai_summary", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(DeadlineHistory)
class DeadlineHistoryAdmin(admin.ModelAdmin):
    list_display = ("assignment", "old_due", "new_due", "source")
