from django.contrib import admin

from .models import AssignmentEvent, SyncCursor, SyncRun


@admin.register(SyncRun)
class SyncRunAdmin(admin.ModelAdmin):
    list_display = ("user", "started_at", "new_count", "updated_count", "result")
    list_filter = ("result",)


@admin.register(SyncCursor)
class SyncCursorAdmin(admin.ModelAdmin):
    list_display = ("subject", "last_ok_at")


@admin.register(AssignmentEvent)
class AssignmentEventAdmin(admin.ModelAdmin):
    list_display = ("kind", "user", "assignment", "created_at")
