import datetime
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Subject
from apps.ai_assistant.advisor import analyze_assignment
from apps.ai_assistant.models import AiFeedback, AiSummary
from apps.assignments.models import Assignment, Priority, Status


class AiAssistantApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="ai_api_student", password="Password123!"
        )
        self.other_user = User.objects.create_user(
            username="other_ai_student", password="Password123!"
        )
        self.client.force_authenticate(user=self.user)

        self.status_todo, _ = Status.objects.get_or_create(
            code="NOT_STARTED", defaults={"label": "Not Started"}
        )
        self.status_done, _ = Status.objects.get_or_create(
            code="COMPLETED", defaults={"label": "Completed"}
        )
        self.priority_high, _ = Priority.objects.get_or_create(
            code="HIGH", defaults={"rank": 3}
        )
        self.priority_med, _ = Priority.objects.get_or_create(
            code="MEDIUM", defaults={"rank": 2}
        )

        self.term, _ = AcademicTerm.objects.get_or_create(
            name="1st Sem AI Test 2026",
            defaults={
                "starts_on": datetime.date(2026, 8, 1),
                "ends_on": datetime.date(2026, 12, 20),
                "is_active": True,
            },
        )
        self.subject, _ = Subject.objects.get_or_create(
            user=self.user,
            term=self.term,
            name="Algorithms",
            defaults={"color": "#2563EB", "teams_group_id": "teams_algo_ai_test"},
        )

        self.analyzed_assignment = Assignment.objects.create(
            user=self.user,
            subject=self.subject,
            status=self.status_todo,
            priority=self.priority_high,
            title="Graph Shortest Path Lab",
            instructions="1. Implement Dijkstra.\n2. Implement Bellman-Ford.\n3. Compare runtime.",
            due_at=timezone.now() + datetime.timedelta(days=2),
        )
        self.summary = analyze_assignment(self.analyzed_assignment)

        self.unanalyzed_assignment = Assignment.objects.create(
            user=self.user,
            subject=self.subject,
            status=self.status_todo,
            priority=self.priority_med,
            title="Dynamic Programming Problem Set",
            instructions="Solve knapsack and longest common subsequence.",
            due_at=timezone.now() + datetime.timedelta(days=4),
        )

        self.other_assignment = Assignment.objects.create(
            user=self.other_user,
            status=self.status_todo,
            priority=self.priority_high,
            title="Other User Confidential Task",
            instructions="Secret instructions.",
        )
        analyze_assignment(self.other_assignment)

    def test_workspace_returns_scoped_summaries_unanalyzed_and_insights(self):
        url = reverse("api_v1_assistant:workspace")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertIn("workspace_insights", response.data)
        self.assertIn("summaries", response.data)
        self.assertIn("unanalyzed_assignments", response.data)

        insights = response.data["workspace_insights"]
        self.assertEqual(insights["analyzed_count"], 1)
        self.assertEqual(insights["pending_analysis_count"], 1)
        self.assertIn(insights["complexity_level"], ["Light", "Balanced", "Heavy"])
        self.assertGreater(insights["estimated_total_minutes"], 0)
        self.assertTrue(len(insights["study_recommendation"]) > 0)

        summary_titles = [s["assignment"]["title"] for s in response.data["summaries"]]
        self.assertEqual(summary_titles, ["Graph Shortest Path Lab"])
        self.assertIn("complexity", response.data["summaries"][0])
        self.assertIn("estimated_minutes", response.data["summaries"][0])
        self.assertIn("adopted_titles", response.data["summaries"][0])

        unanalyzed_titles = [
            a["title"] for a in response.data["unanalyzed_assignments"]
        ]
        self.assertEqual(unanalyzed_titles, ["Dynamic Programming Problem Set"])

    def test_analyze_assignment_endpoint_creates_summary_and_rejects_other_user(self):
        url = reverse(
            "api_v1_assistant:analyze", args=[self.unanalyzed_assignment.id]
        )
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            AiSummary.objects.filter(assignment=self.unanalyzed_assignment).exists()
        )
        self.assertEqual(
            response.data["assignment"]["title"], "Dynamic Programming Problem Set"
        )

        # Other user's assignment must 404
        other_url = reverse("api_v1_assistant:analyze", args=[self.other_assignment.id])
        self.assertEqual(self.client.post(other_url, format="json").status_code, 404)

    def test_analyze_all_active_endpoint_processes_pending_assignments(self):
        url = reverse("api_v1_assistant:analyze-all")
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["analyzed_count"], 1)
        self.assertTrue(
            AiSummary.objects.filter(assignment=self.unanalyzed_assignment).exists()
        )

    def test_feedback_endpoint_records_rating_for_own_summary(self):
        url = reverse("api_v1_assistant:feedback", args=[self.summary.id])
        response = self.client.post(url, {"rating": "UP"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["rating"], "UP")
        self.assertTrue(
            AiFeedback.objects.filter(ai_summary=self.summary, rating="UP").exists()
        )

        # Invalid rating rejected
        bad_resp = self.client.post(url, {"rating": "INVALID"}, format="json")
        self.assertEqual(bad_resp.status_code, 400)

    def test_unauthenticated_assistant_requests_rejected(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(reverse("api_v1_assistant:workspace")).status_code, 401
        )
