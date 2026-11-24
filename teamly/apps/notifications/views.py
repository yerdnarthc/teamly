from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from .forms import NotificationPreferenceForm
from .models import NotificationLog, NotificationPreference, Reminder

# Notifications slice: owns notification preferences, scheduled reminders,
# and sent notification history.


@login_required
def notifications_view(request):
    """Manages scheduled reminders, notification logs, and notification preferences."""
    pref, _ = NotificationPreference.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = NotificationPreferenceForm(request.POST, instance=pref)
        if form.is_valid():
            form.save()
            return redirect("notifications:notifications")
    else:
        form = NotificationPreferenceForm(instance=pref)

    reminders = (
        Reminder.objects.filter(user=request.user, is_sent=False)
        .select_related("assignment")
        .order_by("remind_at")
    )
    logs = NotificationLog.objects.filter(user=request.user).order_by("-sent_at")[:20]

    return render(
        request,
        "notifications/notifications.html",
        {"reminders": reminders, "logs": logs, "form": form, "preference": pref},
    )
