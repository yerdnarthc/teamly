from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Profile


class ProfileSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="prof_user", password="Testpass123!"
        )

    def test_anonymous_profile_redirects_to_login(self):
        response = self.client.get(reverse("profile:profile"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/profile/"
        )

    def test_profile_update_saves_data(self):
        self.client.login(username="prof_user", password="Testpass123!")
        response = self.client.post(
            reverse("profile:profile"),
            {"first_name": "Prof", "last_name": "User", "bio": "IM2 student"},
        )
        self.assertRedirects(response, reverse("profile:profile"))
        profile = Profile.objects.get(user=self.user)
        self.assertEqual(profile.first_name, "Prof")
        self.assertEqual(profile.last_name, "User")
        self.assertEqual(profile.bio, "IM2 student")
