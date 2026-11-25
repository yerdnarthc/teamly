import datetime
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Subject
from apps.assignments.models import Assignment, Priority, Status


class AcademicApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="academic_api_user", password="Password123!"
        )
        self.other_user = User.objects.create_user(
            username="other_academic_user", password="Password123!"
        )
        self.client.force_authenticate(user=self.user)

        self.term_active, _ = AcademicTerm.objects.get_or_create(
            name="2nd Sem 2026",
            defaults={
                "starts_on": datetime.date(2026, 8, 1),
                "ends_on": datetime.date(2026, 12, 20),
                "is_active": True,
            },
        )
        self.term_other, _ = AcademicTerm.objects.get_or_create(
            name="Summer 2026 (Other)",
            defaults={
                "starts_on": datetime.date(2026, 6, 1),
                "ends_on": datetime.date(2026, 7, 25),
                "is_active": False,
            },
        )

        self.subject, _ = Subject.objects.get_or_create(
            user=self.user,
            term=self.term_active,
            name="Software Engineering",
            defaults={"color": "#2563EB", "teams_group_id": "teams_se_2026"},
        )
        self.other_subject, _ = Subject.objects.get_or_create(
            user=self.other_user,
            term=self.term_other,
            name="Hidden Course",
            defaults={"color": "#DC2626", "teams_group_id": "teams_hidden_2026"},
        )

        status_todo, _ = Status.objects.get_or_create(
            code="NOT_STARTED", defaults={"label": "Not Started"}
        )
        status_done, _ = Status.objects.get_or_create(
            code="COMPLETED", defaults={"label": "Completed"}
        )
        priority_med, _ = Priority.objects.get_or_create(
            code="MEDIUM", defaults={"rank": 2}
        )

        Assignment.objects.create(
            user=self.user,
            subject=self.subject,
            status=status_todo,
            priority=priority_med,
            title="Active SE Task",
        )
        Assignment.objects.create(
            user=self.user,
            subject=self.subject,
            status=status_done,
            priority=priority_med,
            title="Done SE Task",
        )

    def test_list_subjects_includes_term_and_assignment_counts(self):
        url = reverse("api_v1_academic:subject-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        subj = response.data[0]
        self.assertEqual(subj["name"], "Software Engineering")
        self.assertEqual(subj["color"], "#2563EB")
        self.assertIn("term", subj)
        self.assertEqual(subj["term"]["name"], "2nd Sem 2026")
        self.assertEqual(subj["term"]["starts_on"], "2026-08-01")
        self.assertEqual(subj["term"]["ends_on"], "2026-12-20")
        self.assertTrue(subj["term"]["is_active"])
        self.assertEqual(subj["assignment_count"], 2)
        self.assertEqual(subj["active_assignment_count"], 1)

    def test_list_terms_scoped_to_user_subjects(self):
        url = reverse("api_v1_academic:term-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        names = [t["name"] for t in response.data]
        self.assertEqual(names, ["2nd Sem 2026"])

    def test_unauthenticated_academic_requests_rejected(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(reverse("api_v1_academic:subject-list")).status_code, 401)
        self.assertEqual(self.client.get(reverse("api_v1_academic:term-list")).status_code, 401)
