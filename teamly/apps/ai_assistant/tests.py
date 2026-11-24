from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from apps.assignments.models import Assignment, Priority, Status, Subtask
from .advisor import adopt_suggested_subtask, analyze_assignment
from .models import AiFeedback, AiSummary


class AiAssistantSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="ai_user", password="Testpass123!"
        )
        status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        priority = Priority.objects.create(code="MEDIUM", rank=2)
        self.assignment = Assignment.objects.create(
            user=self.user,
            status=status,
            priority=priority,
            title="Database Project",
            instructions="Design ERD diagram. Implement models and seed demo data. Submit report PDF.",
        )

    def test_anonymous_assistant_redirects_to_login(self):
        response = self.client.get(reverse("ai_assistant:assistant"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/assistant/"
        )

    def test_summary_and_feedback(self):
        summary = AiSummary.objects.create(
            assignment=self.assignment, summary="Short version."
        )
        self.assertEqual(str(summary), "Summary for Database Project")
        feedback = AiFeedback.objects.create(
            ai_summary=summary,
            rating=AiFeedback.Rating.UP,
        )
        self.assertIn("Feedback (UP)", str(feedback))

    def test_analyze_assignment_deterministic_adapter(self):
        summary = analyze_assignment(self.assignment)
        self.assertIsNotNone(summary)
        self.assertTrue(len(summary.summary) > 0)
        self.assertTrue(len(summary.suggested_subtasks) > 0)
        self.assertIn("ERD", str(summary.requirements) + str(summary.suggested_subtasks))

    def test_adopt_suggested_subtask_creates_authoritative_subtask(self):
        subtask = adopt_suggested_subtask(self.assignment, "Design ERD diagram")
        self.assertIsInstance(subtask, Subtask)
        self.assertEqual(subtask.assignment, self.assignment)
        self.assertEqual(subtask.title, "Design ERD diagram")
        self.assertFalse(subtask.is_done)

        # Idempotent: adopting same title doesn't duplicate
        subtask_again = adopt_suggested_subtask(self.assignment, "Design ERD diagram")
        self.assertEqual(subtask.pk, subtask_again.pk)
        self.assertEqual(self.assignment.subtasks.count(), 1)

    def test_analyze_view_post_updates_summary_and_redirects(self):
        self.client.login(username="ai_user", password="Testpass123!")
        response = self.client.post(
            reverse("ai_assistant:analyze", args=[self.assignment.pk])
        )
        self.assertRedirects(
            response, reverse("assignments:detail", args=[self.assignment.pk])
        )
        self.assertTrue(AiSummary.objects.filter(assignment=self.assignment).exists())

    def test_adopt_view_post_creates_subtask_and_redirects(self):
        self.client.login(username="ai_user", password="Testpass123!")
        response = self.client.post(
            reverse("ai_assistant:adopt", args=[self.assignment.pk]),
            {"title": "Implement models and seed demo data"},
        )
        self.assertRedirects(
            response, reverse("assignments:detail", args=[self.assignment.pk])
        )
        self.assertTrue(
            Subtask.objects.filter(
                assignment=self.assignment, title="Implement models and seed demo data"
            ).exists()
        )

    def test_assignment_detail_renders_ai_summary_and_adoption_state(self):
        self.client.login(username="ai_user", password="Testpass123!")
        analyze_assignment(self.assignment)

        # Before adoption: shows adopt button
        response = self.client.get(
            reverse("assignments:detail", args=[self.assignment.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "AI Assistant Analysis")
        self.assertContains(response, "Suggested Action Items")
        self.assertContains(response, "+ Adopt Subtask")

        # Adopt a suggestion
        summary = self.assignment.ai_summary
        first_suggestion = summary.suggested_subtasks[0]
        adopt_suggested_subtask(self.assignment, first_suggestion)

        # After adoption: shows In Checklist badge
        response_after = self.client.get(
            reverse("assignments:detail", args=[self.assignment.pk])
        )
        self.assertEqual(response_after.status_code, 200)
        self.assertContains(response_after, "✓ In Checklist")



