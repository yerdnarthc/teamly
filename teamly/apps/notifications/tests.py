import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.assignments.models import Assignment, Priority, Status

from .models import NotificationPreference, Reminder


class NotificationsSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notif_user", password="Testpass123!"
        )
        status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        priority = Priority.objects.create(code="LOW", rank=1)
        self.assignment = Assignment.objects.create(
            user=self.user, status=status, priority=priority, title="Quiz"
        )

    def test_anonymous_notifications_redirects_to_login(self):
        response = self.client.get(reverse("notifications:notifications"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/notifications/"
        )

    def test_reminder_str_mentions_assignment(self):
        reminder = Reminder.objects.create(
            user=self.user,
            assignment=self.assignment,
            remind_at=timezone.now() + datetime.timedelta(hours=24),
        )
        self.assertIn("Quiz", str(reminder))

    def test_notification_preference_defaults_and_str(self):
        pref = NotificationPreference.objects.create(user=self.user)
        self.assertTrue(pref.new_assignment)
        self.assertTrue(pref.deadline_enabled)
        self.assertEqual(pref.lead_hours, 24)
        self.assertIn("notif_user", str(pref))

    def test_schedule_deadline_reminder_engine(self):
        from .services import schedule_deadline_reminder

        now = timezone.now()
        due = now + datetime.timedelta(days=2)
        self.assignment.due_at = due
        self.assignment.save()

        # With default preferences (deadline_enabled=True, lead_hours=24)
        reminder = schedule_deadline_reminder(self.assignment)
        self.assertIsNotNone(reminder)
        self.assertEqual(reminder.remind_at, due - datetime.timedelta(hours=24))

        # When disabled, should not schedule
        pref, _ = NotificationPreference.objects.get_or_create(user=self.user)
        pref.deadline_enabled = False
        pref.save()
        reminder.delete()

        disabled_reminder = schedule_deadline_reminder(self.assignment)
        self.assertIsNone(disabled_reminder)

    def test_notifications_view_updates_preferences(self):
        self.client.login(username="notif_user", password="Testpass123!")
        response = self.client.post(
            reverse("notifications:notifications"),
            {
                "new_assignment": "on",
                "deadline_enabled": "",
                "lead_hours": "48",
            },
        )
        self.assertRedirects(response, reverse("notifications:notifications"))
        pref = NotificationPreference.objects.get(user=self.user)
        self.assertTrue(pref.new_assignment)
        self.assertFalse(pref.deadline_enabled)
        self.assertEqual(pref.lead_hours, 48)

