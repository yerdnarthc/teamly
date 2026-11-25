import datetime
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Subject
from apps.assignments.models import Assignment, Priority, Status
from apps.notifications.models import NotificationLog, NotificationPreference, Reminder


class NotificationPreferenceApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="notif_student",
            email="notif@univ.edu",
            password="Password123!",
        )
        self.client.force_authenticate(user=self.user)

    def test_anonymous_preferences_request_forbidden(self):
        unauth_client = APIClient()
        response = unauth_client.get(reverse("api_v1_notifications:preferences"))
        self.assertEqual(response.status_code, 401)

    def test_get_notification_preferences_creates_defaults(self):
        response = self.client.get(reverse("api_v1_notifications:preferences"))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["deadline_enabled"])
        self.assertTrue(response.data["new_assignment"])
        self.assertEqual(response.data["lead_hours"], 24)

    def test_patch_notification_preferences_updates_values(self):
        response = self.client.patch(
            reverse("api_v1_notifications:preferences"),
            {
                "deadline_enabled": False,
                "lead_hours": 12,
                "new_assignment": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        pref = NotificationPreference.objects.get(user=self.user)
        self.assertFalse(pref.deadline_enabled)
        self.assertEqual(pref.lead_hours, 12)
        self.assertTrue(pref.new_assignment)

    def test_notification_history_returns_scoped_reminders_and_logs(self):
        status_todo, _ = Status.objects.get_or_create(
            code="NOT_STARTED", defaults={"label": "Not Started"}
        )
        priority_med, _ = Priority.objects.get_or_create(
            code="MEDIUM", defaults={"rank": 2}
        )
        term, _ = AcademicTerm.objects.get_or_create(
            name="Notif Term 2026",
            defaults={"starts_on": "2026-01-01", "ends_on": "2026-06-30"},
        )
        subject, _ = Subject.objects.get_or_create(
            user=self.user,
            term=term,
            name="Operating Systems",
            defaults={"color": "#2563EB", "teams_group_id": "teams_os_notif_test"},
        )
        assignment = Assignment.objects.create(
            user=self.user,
            subject=subject,
            status=status_todo,
            priority=priority_med,
            title="Kernel Scheduler Lab",
            due_at=timezone.now() + datetime.timedelta(days=2),
        )
        reminder = Reminder.objects.create(
            user=self.user,
            assignment=assignment,
            remind_at=timezone.now() + datetime.timedelta(days=1),
            channel=Reminder.Channel.IN_APP,
            is_sent=False,
        )
        NotificationLog.objects.create(
            user=self.user,
            assignment=assignment,
            kind="DEADLINE",
        )

        # Other user's data must not leak
        other_user = User.objects.create_user(
            username="other_notif_student", password="Password123!"
        )
        other_assignment = Assignment.objects.create(
            user=other_user,
            status=status_todo,
            priority=priority_med,
            title="Other Student Assignment",
        )
        other_reminder = Reminder.objects.create(
            user=other_user,
            assignment=other_assignment,
            remind_at=timezone.now() + datetime.timedelta(days=1),
            is_sent=False,
        )
        NotificationLog.objects.create(
            user=other_user,
            assignment=other_assignment,
            kind="DEADLINE",
        )

        url = reverse("api_v1_notifications:history")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.data["summary"]["pending_count"], 1)
        self.assertEqual(response.data["summary"]["delivered_count"], 1)
        self.assertEqual(len(response.data["reminders"]), 1)
        self.assertEqual(response.data["reminders"][0]["id"], reminder.id)
        self.assertEqual(
            response.data["reminders"][0]["assignment"]["subject_name"],
            "Operating Systems",
        )
        self.assertEqual(len(response.data["logs"]), 1)
        self.assertEqual(response.data["logs"][0]["kind"], "DEADLINE")

        # Dismiss own reminder works; dismissing other user's reminder returns 404
        dismiss_url = reverse("api_v1_notifications:reminder-detail", args=[reminder.id])
        self.assertEqual(self.client.delete(dismiss_url).status_code, 204)
        self.assertFalse(Reminder.objects.filter(id=reminder.id).exists())

        other_dismiss_url = reverse(
            "api_v1_notifications:reminder-detail", args=[other_reminder.id]
        )
        self.assertEqual(self.client.delete(other_dismiss_url).status_code, 404)
        self.assertTrue(Reminder.objects.filter(id=other_reminder.id).exists())

    def test_unauthenticated_history_rejected(self):
        unauth = APIClient()
        self.assertEqual(
            unauth.get(reverse("api_v1_notifications:history")).status_code, 401
        )

    def test_updating_preferences_reschedules_and_toggles_reminders(self):
        from datetime import timedelta

        status_todo, _ = Status.objects.get_or_create(
            code="NOT_STARTED", defaults={"label": "Not Started"}
        )
        priority_med, _ = Priority.objects.get_or_create(
            code="MEDIUM", defaults={"rank": 2}
        )
        due_at = (timezone.now() + timedelta(days=4)).replace(microsecond=0)
        assignment = Assignment.objects.create(
            user=self.user,
            title="Pref Reschedule Assignment",
            due_at=due_at,
            status=status_todo,
            priority=priority_med,
        )
        reminder = Reminder.objects.create(
            user=self.user,
            assignment=assignment,
            remind_at=due_at - timedelta(hours=24),
            is_sent=False,
        )

        pref_url = reverse("api_v1_notifications:preferences")
        resp_lead = self.client.patch(pref_url, {"lead_hours": 12}, format="json")
        self.assertEqual(resp_lead.status_code, 200)
        reminder.refresh_from_db()
        self.assertEqual(reminder.remind_at, due_at - timedelta(hours=12))

        resp_disable = self.client.patch(
            pref_url, {"deadline_enabled": False}, format="json"
        )
        self.assertEqual(resp_disable.status_code, 200)
        self.assertFalse(
            Reminder.objects.filter(assignment=assignment, is_sent=False).exists()
        )

