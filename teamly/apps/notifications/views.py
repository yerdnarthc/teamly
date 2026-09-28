from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import NotificationLog, Reminder

# Notifications slice: owns the reminders screen, scheduled reminders
# and the sent log. Preferences live in user_settings.


@login_required
def notifications_view(request):
    reminders = Reminder.objects.filter(user=request.user, is_sent=False).order_by(
        "remind_at"
    )
    logs = NotificationLog.objects.filter(user=request.user).order_by("-sent_at")[:20]
    return render(
        request,
        "notifications/notifications.html",
        {"reminders": reminders, "logs": logs},
    )
