from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class LoginSliceTests(TestCase):
    def test_login_with_bad_credentials_shows_errors(self):
        User.objects.create_user(username="known", password="Testpass123!")
        response = self.client.post(
            reverse("login:login"),
            {"username": "known", "password": "wrong"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "correct username and password")

    def test_logout_get_does_not_log_out(self):
        User.objects.create_user(username="staying", password="Testpass123!")
        self.client.login(username="staying", password="Testpass123!")
        self.client.get(reverse("login:logout"))
        home = self.client.get(reverse("home:home"))
        self.assertEqual(home.status_code, 200)

    def test_logout_post_redirects_to_login(self):
        User.objects.create_user(username="leaving", password="Testpass123!")
        self.client.login(username="leaving", password="Testpass123!")
        response = self.client.post(reverse("login:logout"))
        self.assertRedirects(response, reverse("login:login"))

    def test_evil_next_url_is_ignored(self):
        User.objects.create_user(username="victim", password="Testpass123!")
        response = self.client.post(
            reverse("login:login") + "?next=https://evil.example/phish",
            {"username": "victim", "password": "Testpass123!"},
        )
        self.assertRedirects(response, reverse("home:home"))
