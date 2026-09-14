from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User


class AuthFlowTests(TestCase):
    # Each test covers one realistic scenario in the Prelim flow.

    def test_anonymous_home_redirects_to_login(self):
        response = self.client.get(reverse("home"))
        self.assertRedirects(response, reverse("login") + "?next=/home/")

    def test_register_creates_user_then_login_then_home(self):
        response = self.client.post(reverse("register"), {
            "username": "review_user",
            "password1": "Testpass123!",
            "password2": "Testpass123!",
        })
        # Prelim sequence: Register -> Login (no auto-login) -> Home.
        self.assertRedirects(response, reverse("login"))
        self.assertTrue(User.objects.filter(username="review_user").exists())
        # Still anonymous: home bounces back to login.
        home = self.client.get(reverse("home"))
        self.assertRedirects(home, reverse("login") + "?next=/home/")
        # Second step of the demo: log in, then home greets the user.
        self.client.post(reverse("login"), {
            "username": "review_user",
            "password": "Testpass123!",
        })
        home = self.client.get(reverse("home"))
        self.assertContains(home, "review_user")

    def test_login_with_bad_credentials_shows_errors(self):
        User.objects.create_user(username="known", password="Testpass123!")
        response = self.client.post(reverse("login"), {
            "username": "known",
            "password": "wrong",
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "correct username and password")

    def test_logout_get_does_not_log_out(self):
        User.objects.create_user(username="staying", password="Testpass123!")
        self.client.login(username="staying", password="Testpass123!")
        self.client.get(reverse("logout"))
        home = self.client.get(reverse("home"))
        self.assertEqual(home.status_code, 200)

    def test_evil_next_url_is_ignored(self):
        User.objects.create_user(username="victim", password="Testpass123!")
        response = self.client.post(
            reverse("login") + "?next=https://evil.example/phish",
            {"username": "victim", "password": "Testpass123!"},
        )
        self.assertRedirects(response, reverse("home"))
