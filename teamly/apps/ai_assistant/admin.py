from django.contrib import admin

from .models import (
    AiFeedback,
    AiSummary,
    Attachment,
    DeadlineHistory,
    PersonalNote,
    Subtask,
)


@admin.register(AiSummary)
class AiSummaryAdmin(admin.ModelAdmin):
    list_display = ("assignment", "model", "created_at")


@admin.register(AiFeedback)
class AiFeedbackAdmin(admin.ModelAdmin):
    list_display = ("ai_summary", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(Subtask)
class SubtaskAdmin(admin.ModelAdmin):
    list_display = ("title", "assignment", "is_done", "sort_order")
    list_filter = ("is_done",)


@admin.register(PersonalNote)
class PersonalNoteAdmin(admin.ModelAdmin):
    list_display = ("assignment", "created_at")


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("label", "assignment", "kind", "added_by")


@admin.register(DeadlineHistory)
class DeadlineHistoryAdmin(admin.ModelAdmin):
    list_display = ("assignment", "old_due", "new_due", "source")
