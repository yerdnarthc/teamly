from django.test import TestCase
from django.urls import reverse


class HomeSliceTests(TestCase):
    def test_anonymous_home_redirects_to_login(self):
        response = self.client.get(reverse("home:home"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/home/"
        )
