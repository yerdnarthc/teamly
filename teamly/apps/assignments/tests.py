from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Assignment, Priority, Status


class AssignmentsSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="assign_user", password="Testpass123!"
        )
        self.status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.priority = Priority.objects.create(code="HIGH", rank=3)

    def test_anonymous_assignments_redirects_to_login(self):
        response = self.client.get(reverse("assignments:assignments"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/assignments/"
        )

    def test_assignment_str_returns_title(self):
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Lab 1",
        )
        self.assertEqual(str(assignment), "Lab 1")
        self.assertIsNone(assignment.teams_id)
