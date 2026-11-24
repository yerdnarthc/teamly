from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Subject
from apps.assignments.models import Assignment, Priority, Status


class SyncApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="sync_mobile_student", password="Password123!"
        )
        self.client.force_authenticate(user=self.user)

        Status.objects.get_or_create(code="NOT_STARTED", defaults={"label": "Not Started"})
        Priority.objects.get_or_create(code="MED", defaults={"rank": 2})

        self.term, _ = AcademicTerm.objects.get_or_create(
            name="Sync Term 2026", defaults={"starts_on": "2026-01-01", "ends_on": "2026-06-30"}
        )
        self.subject = Subject.objects.create(
            user=self.user,
            term=self.term,
            name="Physics 101",
            teams_group_id="teams_phys_101",
            color="#10B981",
        )

    def test_sync_teams_returns_structured_report(self):
        url = reverse("api_v1_sync:sync-teams")
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 200)

        # Response must include the structured SyncReport summary
        self.assertIn("created_count", response.data)
        self.assertIn("updated_count", response.data)
        self.assertIn("unchanged_count", response.data)
        self.assertIn("message", response.data)
        self.assertGreaterEqual(response.data["created_count"], 1)

        # Assignment should now exist in database
        self.assertTrue(
            Assignment.objects.filter(
                user=self.user,
                subject=self.subject,
                source=Assignment.Source.TEAMS,
            ).exists()
        )

    def test_repeated_sync_is_idempotent(self):
        url = reverse("api_v1_sync:sync-teams")
        # First sync creates
        self.client.post(url, format="json")
        # Second sync marks unchanged/updated
        response2 = self.client.post(url, format="json")
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(response2.data["created_count"], 0)
        self.assertGreaterEqual(response2.data["unchanged_count"], 1)
