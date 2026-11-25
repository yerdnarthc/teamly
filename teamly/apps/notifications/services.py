import datetime
from django.db import IntegrityError, transaction

from .models import NotificationPreference, Reminder


def schedule_deadline_reminder(assignment):
    """
    Schedules or removes a deadline reminder based on the student's notification preferences.
    If deadline_enabled is True, assignment.due_at is set, and the assignment is not COMPLETED,
    schedules a reminder at `due_at - lead_hours`. Otherwise removes any unsent reminder.
    Idempotent and concurrency-safe: ensures at most one unsent reminder per (user, assignment).
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

    with transaction.atomic():
        existing = list(
            Reminder.objects.select_for_update()
            .filter(user=user, assignment=assignment, is_sent=False)
            .order_by("id")
        )
        if existing:
            reminder = existing[0]
            if len(existing) > 1:
                Reminder.objects.filter(
                    id__in=[r.id for r in existing[1:]]
                ).delete()
            reminder.remind_at = remind_at
            reminder.channel = Reminder.Channel.IN_APP
            reminder.save(update_fields=["remind_at", "channel"])
            return reminder

        try:
            with transaction.atomic():
                return Reminder.objects.create(
                    user=user,
                    assignment=assignment,
                    is_sent=False,
                    remind_at=remind_at,
                    channel=Reminder.Channel.IN_APP,
                )
        except IntegrityError:
            # Another concurrent worker inserted the unique unsent reminder first
            reminder = Reminder.objects.select_for_update().get(
                user=user,
                assignment=assignment,
                is_sent=False,
            )
            reminder.remind_at = remind_at
            reminder.channel = Reminder.Channel.IN_APP
            reminder.save(update_fields=["remind_at", "channel"])
            return reminder


def reschedule_user_reminders(user):
    """
    Re-evaluates all active assignments with deadlines for `user` after a preference change
    (e.g., toggling deadline_enabled or changing lead_hours).
    Serializes per user via NotificationPreference row lock to avoid concurrent races.
    """
    from apps.assignments.models import Assignment

    with transaction.atomic():
        NotificationPreference.objects.select_for_update().get_or_create(user=user)
        assignments = Assignment.objects.filter(user=user).select_related("status")
        for assignment in assignments:
            schedule_deadline_reminder(assignment)


def get_notification_history(user) -> dict:
    """
    Returns scheduled upcoming reminders and historical notification delivery logs
    scoped to `user`.
    """
    from apps.assignments.querysets import serialize_assignment_brief
    from .models import NotificationLog

    pref, _ = NotificationPreference.objects.get_or_create(user=user)

    reminders_qs = (
        Reminder.objects.filter(user=user, is_sent=False)
        .select_related("assignment", "assignment__subject")
        .order_by("remind_at")
    )
    pending_count = reminders_qs.count()
    reminders = [
        {
            "id": r.id,
            "remind_at": r.remind_at,
            "channel": r.channel,
            "is_sent": r.is_sent,
            "assignment": serialize_assignment_brief(r.assignment, include_due_at=True),
        }
        for r in reminders_qs[:30]
    ]

    logs_qs = (
        NotificationLog.objects.filter(user=user)
        .select_related("assignment", "assignment__subject")
        .order_by("-sent_at")
    )
    delivered_count = logs_qs.count()
    logs = [
        {
            "id": log.id,
            "kind": log.kind,
            "sent_at": log.sent_at,
            "assignment": serialize_assignment_brief(log.assignment, include_due_at=True),
        }
        for log in logs_qs[:30]
    ]

    return {
        "summary": {
            "pending_count": pending_count,
            "delivered_count": delivered_count,
            "deadline_enabled": pref.deadline_enabled,
            "lead_hours": pref.lead_hours,
            "new_assignment": pref.new_assignment,
        },
        "reminders": reminders,
        "logs": logs,
    }


def dismiss_user_reminder(user, reminder_id: int) -> bool:
    """Deletes a reminder owned by `user`. Returns True if deleted, False if not found."""
    deleted_count, _ = Reminder.objects.filter(id=reminder_id, user=user).delete()
    return deleted_count > 0
