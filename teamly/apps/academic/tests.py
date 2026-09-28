import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import AcademicTerm, Subject


class AcademicSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="academic_user", password="Testpass123!"
        )
        self.term = AcademicTerm.objects.create(
            name="2026-1",
            starts_on=datetime.date(2026, 1, 1),
            ends_on=datetime.date(2026, 6, 30),
        )

    def test_anonymous_academic_redirects_to_login(self):
        response = self.client.get(reverse("academic:academic"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/academic/"
        )

    def test_subject_str_returns_name(self):
        subject = Subject.objects.create(
            user=self.user,
            term=self.term,
            name="IM2",
            teams_group_id="team-123",
        )
        self.assertEqual(str(subject), "IM2")
        self.assertEqual(str(self.term), "2026-1")
