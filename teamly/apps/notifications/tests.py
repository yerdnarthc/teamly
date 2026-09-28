import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.assignments.models import Assignment, Priority, Status

from .models import Reminder


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
