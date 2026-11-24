from django.contrib import admin

from .models import NotificationLog, NotificationPreference, Reminder


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "new_assignment", "deadline_enabled", "lead_hours")


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("assignment", "user", "remind_at", "channel", "is_sent")
    list_filter = ("is_sent", "channel")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("kind", "user", "assignment", "sent_at")
