import datetime
from django.utils import timezone

from .models import NotificationPreference, Reminder


def schedule_deadline_reminder(assignment):
    """
    Schedules or removes a deadline reminder based on the student's notification preferences.
    If deadline_enabled is True and assignment.due_at is set, schedules a reminder
    at `due_at - lead_hours`.
    """
    user = assignment.user
    pref, _ = NotificationPreference.objects.get_or_create(user=user)

    if not pref.deadline_enabled or not assignment.due_at:
        Reminder.objects.filter(assignment=assignment, user=user, is_sent=False).delete()
        return None

    remind_at = assignment.due_at - datetime.timedelta(hours=pref.lead_hours)

    reminder, _ = Reminder.objects.update_or_create(
        user=user,
        assignment=assignment,
        is_sent=False,
        defaults={
            "remind_at": remind_at,
            "channel": Reminder.Channel.IN_APP,
        },
    )
    return reminder
