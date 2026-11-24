from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import AccountPreference, MicrosoftAccount


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.username = "test_account_user"
        self.password = "ValidPass123!"
        self.user = User.objects.create_user(
            username=self.username, password=self.password
        )

    def test_login_view_get_renders_form(self):
        response = self.client.get(reverse("accounts:login"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Username")

    def test_login_view_post_valid_authenticates(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"username": self.username, "password": self.password},
        )
        self.assertRedirects(response, reverse("home:home"))
        self.assertIn("_auth_user_id", self.client.session)

    def test_login_view_redirects_authenticated_user(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.get(reverse("accounts:login"))
        self.assertRedirects(response, reverse("home:home"))

    def test_logout_view_terminates_session(self):
        self.client.login(username=self.username, password=self.password)
        response = self.client.post(reverse("accounts:logout"))
        self.assertRedirects(response, reverse("login:login"))
        self.assertNotIn("_auth_user_id", self.client.session)


class AccountsRegistrationTests(TestCase):
    def test_register_view_get_renders_form(self):
        response = self.client.get(reverse("accounts:register"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Username")

    def test_register_view_post_creates_user_and_redirects(self):
        post_data = {
            "username": "brand_new_student",
            "password1": "ComplexPass123!",
            "password2": "ComplexPass123!",
        }
        response = self.client.post(reverse("accounts:register"), post_data)
        self.assertRedirects(response, reverse("login:login"))
        self.assertTrue(User.objects.filter(username="brand_new_student").exists())

    def test_register_view_redirects_authenticated_user(self):
        user = User.objects.create_user(username="logged_in", password="pw")
        self.client.login(username="logged_in", password="pw")
        response = self.client.get(reverse("accounts:register"))
        self.assertRedirects(response, reverse("home:home"))


class AccountsModelAndDashboardTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ms_user", password="pw")

    def test_microsoft_account_model(self):
        account = MicrosoftAccount.objects.create(
            user=self.user,
            teams_user_id="teams-user-999",
            tenant_id="tenant-888",
            scopes_granted="User.Read EduAssignments.Read",
        )
        self.assertIn("ms_user", str(account))
        self.assertEqual(account.teams_user_id, "teams-user-999")

    def test_accounts_view_authenticated(self):
        self.client.login(username="ms_user", password="pw")
        response = self.client.get(reverse("accounts:accounts"))
        self.assertEqual(response.status_code, 200)


class AccountSettingsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="settings_student", password="Testpass123!"
        )

    def test_anonymous_settings_redirects_to_login(self):
        response = self.client.get(reverse("accounts:settings"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/accounts/settings/"
        )

    def test_backward_compatible_user_settings_route_redirects_anonymous(self):
        response = self.client.get(reverse("user_settings:settings"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/settings/"
        )

    def test_settings_view_get_renders_3_way_theme_form(self):
        self.client.login(username="settings_student", password="Testpass123!")
        response = self.client.get(reverse("accounts:settings"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Visual Appearance")
        self.assertContains(response, "Match System (Automatic)")
        self.assertContains(response, "Light Mode")
        self.assertContains(response, "Dark Mode")

    def test_settings_view_post_updates_theme_mode(self):
        self.client.login(username="settings_student", password="Testpass123!")
        response = self.client.post(
            reverse("accounts:settings"),
            {"theme": AccountPreference.ThemeMode.DARK},
        )
        self.assertRedirects(response, reverse("accounts:settings"))
        pref = AccountPreference.objects.get(user=self.user)
        self.assertEqual(pref.theme, AccountPreference.ThemeMode.DARK)

        # Context processor verifies data-theme is dark
        res_after = self.client.get(reverse("accounts:settings"))
        self.assertEqual(res_after.context["user_theme"], "dark")
        self.assertContains(res_after, 'data-theme="dark"')




