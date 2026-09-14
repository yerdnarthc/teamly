from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import UserSettings


class UserSettingsSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="settings_user", password="Testpass123!"
        )

    def test_anonymous_settings_redirects_to_login(self):
        response = self.client.get(reverse("user_settings:settings"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/settings/"
        )

    def test_settings_update_saves_data(self):
        self.client.login(username="settings_user", password="Testpass123!")
        response = self.client.post(
            reverse("user_settings:settings"),
            {"dark_mode": "on"},
        )
        self.assertRedirects(response, reverse("user_settings:settings"))
        settings = UserSettings.objects.get(user=self.user)
        self.assertTrue(settings.dark_mode)
        # Unchecked checkbox means False.
        self.assertFalse(settings.email_notifications)
