from django.contrib import admin

from .models import Assignment, AssignmentTag, Priority, Status, Tag


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ("code", "label")


@admin.register(Priority)
class PriorityAdmin(admin.ModelAdmin):
    list_display = ("code", "rank")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "subject", "status", "due_at", "source")
    list_filter = ("status", "source")
    search_fields = ("title", "teams_id")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "user")


@admin.register(AssignmentTag)
class AssignmentTagAdmin(admin.ModelAdmin):
    list_display = ("assignment", "tag")
