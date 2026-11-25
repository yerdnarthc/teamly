import datetime
from django.utils import timezone

from .models import NotificationPreference, Reminder


def schedule_deadline_reminder(assignment):
    """
    Schedules or removes a deadline reminder based on the student's notification preferences.
    If deadline_enabled is True, assignment.due_at is set, and the assignment is not COMPLETED,
    schedules a reminder at `due_at - lead_hours`. Otherwise removes any unsent reminder.
    """
    user = assignment.user
    pref, _ = NotificationPreference.objects.get_or_create(user=user)

    if (
        not pref.deadline_enabled
        or not assignment.due_at
        or assignment.status.code == "COMPLETED"
    ):
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


def reschedule_user_reminders(user):
    """
    Re-evaluates all active assignments with deadlines for `user` after a preference change
    (e.g., toggling deadline_enabled or changing lead_hours).
    """
    from apps.assignments.models import Assignment

    assignments = Assignment.objects.filter(user=user).select_related("status")
    for assignment in assignments:
        schedule_deadline_reminder(assignment)
