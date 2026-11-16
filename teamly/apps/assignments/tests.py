from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Assignment, Priority, Status


class AssignmentsSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="assign_user", password="Testpass123!"
        )
        self.status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.status_completed = Status.objects.create(code="COMPLETED", label="Completed")
        self.priority = Priority.objects.create(code="HIGH", rank=3)

    def test_anonymous_assignments_redirects_to_login(self):
        response = self.client.get(reverse("assignments:list"))
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

    def test_authenticated_list_displays_assignments(self):
        self.client.login(username="assign_user", password="Testpass123!")
        Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Software Engineering Project",
        )
        response = self.client.get(reverse("assignments:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Software Engineering Project")

    def test_manual_assignment_create(self):
        self.client.login(username="assign_user", password="Testpass123!")
        post_data = {
            "title": "New Milestone Task",
            "status": self.status.pk,
            "priority": self.priority.pk,
            "due_at": "2026-11-20T14:00",
            "instructions": "Write unit tests and verify.",
        }
        response = self.client.post(reverse("assignments:create"), post_data)
        self.assertRedirects(response, reverse("assignments:list"))
        self.assertTrue(Assignment.objects.filter(title="New Milestone Task").exists())
        created = Assignment.objects.get(title="New Milestone Task")
        self.assertEqual(created.source, Assignment.Source.MANUAL)
        self.assertEqual(created.user, self.user)

    def test_assignment_detail_view(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Detailed Assignment",
            instructions="Comprehensive task specs.",
        )
        response = self.client.get(reverse("assignments:detail", args=[assignment.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Detailed Assignment")
        self.assertContains(response, "Comprehensive task specs.")

    def test_assignment_update_status(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Task To Complete",
        )
        response = self.client.post(
            reverse("assignments:update_status", args=[assignment.pk]),
            {"status_code": "COMPLETED"},
        )
        self.assertRedirects(response, reverse("assignments:detail", args=[assignment.pk]))
        assignment.refresh_from_db()
        self.assertEqual(assignment.status.code, "COMPLETED")

    def test_assignment_delete(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Task To Delete",
        )
        response = self.client.post(reverse("assignments:delete", args=[assignment.pk]))
        self.assertRedirects(response, reverse("assignments:list"))
        self.assertFalse(Assignment.objects.filter(pk=assignment.pk).exists())
