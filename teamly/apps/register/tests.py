from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class RegisterSliceTests(TestCase):
    def test_register_creates_user_then_login_then_home(self):
        response = self.client.post(
            reverse("register:register"),
            {
                "username": "review_user",
                "password1": "Testpass123!",
                "password2": "Testpass123!",
            },
        )
        # Register -> Login (no auto-login) -> Home.
        self.assertRedirects(response, reverse("login:login"))
        self.assertTrue(User.objects.filter(username="review_user").exists())
        # Still anonymous: home bounces back to login.
        home = self.client.get(reverse("home:home"))
        self.assertRedirects(
            home, reverse("login:login") + "?next=/home/"
        )
        # Second step of the demo: log in, then home greets the user.
        self.client.post(
            reverse("login:login"),
            {"username": "review_user", "password": "Testpass123!"},
        )
        home = self.client.get(reverse("home:home"))
        self.assertContains(home, "review_user")
