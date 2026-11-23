from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from apps.assignments.models import Assignment, Priority, Status

from .models import AiFeedback, AiSummary


class AiAssistantSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="ai_user", password="Testpass123!"
        )
        status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        priority = Priority.objects.create(code="MEDIUM", rank=2)
        self.assignment = Assignment.objects.create(
            user=self.user, status=status, priority=priority, title="Essay"
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
        self.assertEqual(str(summary), "Summary for Essay")
        feedback = AiFeedback.objects.create(
            ai_summary=summary,
            rating=AiFeedback.Rating.UP,
        )
        self.assertIn("Feedback (UP)", str(feedback))

