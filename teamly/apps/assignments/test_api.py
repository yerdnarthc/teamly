from datetime import timedelta
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Subject
from apps.ai_assistant.advisor import analyze_assignment
from apps.assignments.models import Assignment, Priority, Status, Subtask


class AssignmentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="student_api", password="Password123!"
        )
        self.other_user = User.objects.create_user(
            username="other_student", password="Password123!"
        )

        # Authenticate via JWT for all requests
        self.client.force_authenticate(user=self.user)

        self.status_todo, _ = Status.objects.get_or_create(
            code="NOT_STARTED", defaults={"label": "Not Started"}
        )
        self.status_done, _ = Status.objects.get_or_create(
            code="COMPLETED", defaults={"label": "Completed"}
        )
        self.priority_high, _ = Priority.objects.get_or_create(
            code="HIGH", defaults={"rank": 1}
        )
        self.priority_med, _ = Priority.objects.get_or_create(
            code="MED", defaults={"rank": 2}
        )

        self.term, _ = AcademicTerm.objects.get_or_create(
            name="First Term 2026", defaults={"starts_on": "2026-01-01", "ends_on": "2026-06-30"}
        )
        self.subject, _ = Subject.objects.get_or_create(
            user=self.user, term=self.term, name="CS 101", color="#3B82F6", teams_group_id="teams_cs101"
        )

        self.assignment = Assignment.objects.create(
            user=self.user,
            subject=self.subject,
            status=self.status_todo,
            priority=self.priority_high,
            title="Implement Sorting Algorithm",
            instructions="1. Implement Quicksort.\n2. Write unit tests.\n3. Benchmark performance.",
            due_at=timezone.now() + timedelta(days=2),
        )

        self.subtask = Subtask.objects.create(
            assignment=self.assignment,
            title="Setup test scaffolding",
            is_done=False,
        )

        # Another user's assignment (for security scoping checks)
        self.other_assignment = Assignment.objects.create(
            user=self.other_user,
            status=self.status_todo,
            priority=self.priority_med,
            title="Other Student Secret Assignment",
        )

    def test_list_assignments_scoped_to_user(self):
        url = reverse("api_v1_assignments:assignment-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        # Should only see own assignment, never other_user's
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        titles = [a["title"] for a in results]
        self.assertIn("Implement Sorting Algorithm", titles)
        self.assertNotIn("Other Student Secret Assignment", titles)

    def test_retrieve_assignment_detail_with_subtasks_and_ai(self):
        # Generate AI summary to test embedded AI details
        analyze_assignment(self.assignment)

        url = reverse("api_v1_assignments:assignment-detail", args=[self.assignment.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Implement Sorting Algorithm")
        self.assertEqual(response.data["status"]["code"], "NOT_STARTED")
        self.assertEqual(response.data["priority"]["code"], "HIGH")
        self.assertEqual(len(response.data["subtasks"]), 1)
        self.assertEqual(response.data["subtasks"][0]["title"], "Setup test scaffolding")
        self.assertIsNotNone(response.data["ai_summary"])
        self.assertIn("suggested_subtasks", response.data["ai_summary"])

    def test_retrieve_other_user_assignment_forbidden_or_404(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.other_assignment.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_create_assignment_scoped_to_request_user(self):
        url = reverse("api_v1_assignments:assignment-list")
        payload = {
            "title": "New Mobile Assignment",
            "instructions": "Study chapter 4",
            "subject_id": self.subject.id,
            "status_code": "NOT_STARTED",
            "priority_code": "HIGH",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        created_id = response.data["id"]
        created = Assignment.objects.get(id=created_id)
        self.assertEqual(created.user, self.user)
        self.assertEqual(created.title, "New Mobile Assignment")

    def test_update_assignment_status(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.assignment.id])
        response = self.client.patch(url, {"status_code": "COMPLETED"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status.code, "COMPLETED")

    def test_toggle_subtask_completion(self):
        url = reverse("api_v1_assignments:subtask-toggle", args=[self.subtask.id])
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.subtask.refresh_from_db()
        self.assertTrue(self.subtask.is_done)

        # Toggle back
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.subtask.refresh_from_db()
        self.assertFalse(self.subtask.is_done)

    def test_adopt_suggested_ai_subtask(self):
        url = reverse(
            "api_v1_assignments:assignment-adopt-subtask", args=[self.assignment.id]
        )
        payload = {"title": "Benchmark performance"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Subtask.objects.filter(
                assignment=self.assignment, title="Benchmark performance"
            ).exists()
        )
