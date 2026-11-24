from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import MicrosoftAccount
from apps.profile.models import Profile


class ProfileApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="student_profile",
            email="student@univ.edu",
            password="Password123!",
        )
        self.profile, _ = Profile.objects.get_or_create(
            user=self.user,
            defaults={
                "first_name": "Ada",
                "middle_name": "M.",
                "last_name": "Lovelace",
                "bio": "Studying Analytical Computing",
            },
        )
        self.client.force_authenticate(user=self.user)

    def test_anonymous_profile_request_forbidden(self):
        unauth_client = APIClient()
        response = unauth_client.get(reverse("api_v1_profile:profile"))
        self.assertEqual(response.status_code, 401)

    def test_get_profile_returns_details_and_ms_status(self):
        # Create a linked MS Account
        MicrosoftAccount.objects.create(
            user=self.user,
            teams_user_id="teams_ada_123",
            tenant_id="tenant_univ_456",
            scopes_granted="EduAssignments.ReadWrite",
        )
        response = self.client.get(reverse("api_v1_profile:profile"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "student_profile")
        self.assertEqual(response.data["email"], "student@univ.edu")
        self.assertEqual(response.data["first_name"], "Ada")
        self.assertEqual(response.data["last_name"], "Lovelace")
        self.assertEqual(response.data["bio"], "Studying Analytical Computing")
        self.assertIsNotNone(response.data["microsoft_account"])
        self.assertTrue(response.data["microsoft_account"]["is_connected"])
        self.assertEqual(
            response.data["microsoft_account"]["teams_user_id"], "teams_ada_123"
        )

    def test_patch_profile_updates_fields(self):
        response = self.client.patch(
            reverse("api_v1_profile:profile"),
            {
                "first_name": "Augusta",
                "last_name": "King",
                "bio": "First Computer Programmer",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.first_name, "Augusta")
        self.assertEqual(self.profile.last_name, "King")
        self.assertEqual(self.profile.bio, "First Computer Programmer")
