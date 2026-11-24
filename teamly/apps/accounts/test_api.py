from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class JwtAuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = "api_student"
        self.password = "SecureStudent123!"
        self.user = User.objects.create_user(
            username=self.username, password=self.password, email="student@school.edu"
        )

    def test_token_obtain_pair_success(self):
        url = reverse("api_v1_auth:token_obtain_pair")
        response = self.client.post(
            url, {"username": self.username, "password": self.password}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_token_obtain_pair_invalid_credentials(self):
        url = reverse("api_v1_auth:token_obtain_pair")
        response = self.client.post(
            url, {"username": self.username, "password": "WrongPassword!"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_token_refresh_success(self):
        obtain_url = reverse("api_v1_auth:token_obtain_pair")
        obtain_res = self.client.post(
            obtain_url, {"username": self.username, "password": self.password}, format="json"
        )
        refresh_token = obtain_res.data["refresh"]

        refresh_url = reverse("api_v1_auth:token_refresh")
        response = self.client.post(refresh_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        # We configured ROTATE_REFRESH_TOKENS = True, so a new refresh token is returned
        self.assertIn("refresh", response.data)

    def test_token_blacklist_logout(self):
        obtain_url = reverse("api_v1_auth:token_obtain_pair")
        obtain_res = self.client.post(
            obtain_url, {"username": self.username, "password": self.password}, format="json"
        )
        refresh_token = obtain_res.data["refresh"]
        access_token = obtain_res.data["access"]

        # Blacklist (logout)
        blacklist_url = reverse("api_v1_auth:token_blacklist")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.post(blacklist_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(response.status_code, 200)

        # Trying to refresh with the blacklisted token should now fail
        refresh_url = reverse("api_v1_auth:token_refresh")
        refresh_res = self.client.post(refresh_url, {"refresh": refresh_token}, format="json")
        self.assertEqual(refresh_res.status_code, 401)

    def test_api_user_registration(self):
        register_url = reverse("api_v1_auth:register")
        payload = {
            "username": "new_mobile_student",
            "password": "StrongPassword987!",
            "email": "mobile@school.edu",
        }
        response = self.client.post(register_url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username="new_mobile_student").exists())
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
