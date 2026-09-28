from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import SyncRun


class SyncSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="sync_user", password="Testpass123!"
        )

    def test_anonymous_sync_redirects_to_login(self):
        response = self.client.get(reverse("sync:sync"))
        self.assertRedirects(response, reverse("login:login") + "?next=/sync/")

    def test_sync_run_str_mentions_user(self):
        run = SyncRun.objects.create(user=self.user, new_count=2)
        self.assertIn("sync_user", str(run))
