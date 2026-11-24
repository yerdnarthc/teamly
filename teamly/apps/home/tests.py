from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
import datetime

from apps.assignments.models import Assignment, Priority, Status


class HomeSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="home_user", password="Testpass123!"
        )
        self.status_pending = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.status_done = Status.objects.create(code="COMPLETED", label="Completed")
        self.priority = Priority.objects.create(code="HIGH", rank=3)

    def test_anonymous_home_redirects_to_login(self):
        response = self.client.get(reverse("home:home"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/home/"
        )

    def test_authenticated_dashboard_displays_workload_metrics(self):
        self.client.login(username="home_user", password="Testpass123!")
        now = timezone.now()
        # 1 overdue
        Assignment.objects.create(
            user=self.user,
            status=self.status_pending,
            priority=self.priority,
            title="Overdue Math Homework",
            due_at=now - datetime.timedelta(days=2),
        )
        # 1 completed
        Assignment.objects.create(
            user=self.user,
            status=self.status_done,
            priority=self.priority,
            title="Completed Essay",
            due_at=now - datetime.timedelta(days=1),
        )
        # 1 upcoming
        Assignment.objects.create(
            user=self.user,
            status=self.status_pending,
            priority=self.priority,
            title="Upcoming Final Project",
            due_at=now + datetime.timedelta(days=3),
        )

        response = self.client.get(reverse("home:home"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["total_count"], 3)
        self.assertEqual(response.context["completed_count"], 1)
        self.assertEqual(response.context["active_count"], 2)
        self.assertEqual(response.context["overdue_count"], 1)
        self.assertContains(response, "Upcoming Final Project")
