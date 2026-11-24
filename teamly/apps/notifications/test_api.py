from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.notifications.models import NotificationPreference


class NotificationPreferenceApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="notif_student",
            email="notif@univ.edu",
            password="Password123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_anonymous_preferences_request_forbidden(self):
        unauth_client = APIClient()
        response = unauth_client.get(reverse("api_v1_notifications:preferences"))
        self.assertEqual(response.status_code, 401)

    def test_get_notification_preferences_creates_defaults(self):
        response = self.client.get(reverse("api_v1_notifications:preferences"))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["deadline_enabled"])
        self.assertTrue(response.data["new_assignment"])
        self.assertEqual(response.data["lead_hours"], 24)

    def test_patch_notification_preferences_updates_values(self):
        response = self.client.patch(
            reverse("api_v1_notifications:preferences"),
            {
                "deadline_enabled": False,
                "lead_hours": 12,
                "new_assignment": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        pref = NotificationPreference.objects.get(user=self.user)
        self.assertFalse(pref.deadline_enabled)
        self.assertEqual(pref.lead_hours, 12)
        self.assertTrue(pref.new_assignment)
