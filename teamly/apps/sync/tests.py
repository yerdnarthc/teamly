import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.academic.models import AcademicTerm, Subject
from apps.assignments.models import Assignment, Priority, Status, Subtask
from apps.notifications.models import NotificationPreference, Reminder
from apps.sync.ingestion import SyncReport, ingest_subject_assignments
from .models import AssignmentEvent, SyncCursor, SyncRun


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

    def test_sync_view_authenticated_renders_subjects_and_cursors(self):
        self.client.login(username="sync_user", password="Testpass123!")
        response = self.client.get(reverse("sync:sync"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "sync/sync.html")

    def test_sync_trigger_post_executes_ingestion(self):
        term = AcademicTerm.objects.create(
            name="2026-Term-Sync",
            starts_on=datetime.date(2026, 1, 1),
            ends_on=datetime.date(2026, 6, 30),
        )
        Subject.objects.create(
            user=self.user,
            term=term,
            name="Operating Systems",
            teams_group_id="os-group-101",
        )
        self.client.login(username="sync_user", password="Testpass123!")
        response = self.client.post(reverse("sync:trigger"))
        self.assertRedirects(response, reverse("sync:sync"))

        self.assertTrue(
            Assignment.objects.filter(
                user=self.user, teams_id="teams-os-group-101-milestone"
            ).exists()
        )



class AssignmentIngestionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ingest_user", password="Pw!")
        self.term = AcademicTerm.objects.create(
            name="2026-Term1",
            starts_on=datetime.date(2026, 1, 1),
            ends_on=datetime.date(2026, 6, 30),
        )
        self.subject = Subject.objects.create(
            user=self.user,
            term=self.term,
            name="CSIT321 - Applications Dev",
            teams_group_id="teams-group-321",
        )
        self.status_not_started = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.status_in_progress = Status.objects.create(code="IN_PROGRESS", label="In Progress")
        self.priority_medium = Priority.objects.create(code="MEDIUM", rank=2)
        self.priority_urgent = Priority.objects.create(code="URGENT", rank=4)
        NotificationPreference.objects.create(user=self.user, deadline_enabled=True, lead_hours=24)

    def test_ingest_new_assignments_creates_records_and_emits_events(self):
        due = timezone.now() + datetime.timedelta(days=3)
        raw_payload = [
            {
                "id": "teams-asg-101",
                "displayName": "Midterm Lab Assignment",
                "instructions": {"content": "<p>Build a deep module.</p>"},
                "dueDateTime": due.isoformat(),
                "webUrl": "https://teams.microsoft.com/l/assignment/101",
            }
        ]
        report = ingest_subject_assignments(self.user, self.subject, raw_payload)

        self.assertEqual(report.created_count, 1)
        self.assertEqual(report.updated_count, 0)
        self.assertEqual(report.events_emitted, 1)

        assignment = Assignment.objects.get(teams_id="teams-asg-101")
        self.assertEqual(assignment.user, self.user)
        self.assertEqual(assignment.subject, self.subject)
        self.assertEqual(assignment.title, "Midterm Lab Assignment")
        self.assertIn("Build a deep module.", assignment.instructions)
        self.assertEqual(assignment.source, Assignment.Source.TEAMS)
        self.assertEqual(assignment.status, self.status_not_started)
        self.assertEqual(assignment.priority, self.priority_medium)

        # Check that an AssignmentEvent was emitted
        event = AssignmentEvent.objects.get(assignment=assignment)
        self.assertEqual(event.kind, "ASSIGNMENT_CREATED")

        # Check reminder was scheduled
        self.assertTrue(Reminder.objects.filter(assignment=assignment).exists())

    def test_ingest_preserves_student_managed_fields(self):
        due = timezone.now() + datetime.timedelta(days=4)
        # 1. First sync creates the assignment
        raw_payload = [
            {
                "id": "teams-asg-102",
                "displayName": "Original Title",
                "instructions": {"content": "Original instructions"},
                "dueDateTime": due.isoformat(),
                "webUrl": "https://teams.microsoft.com/102",
            }
        ]
        ingest_subject_assignments(self.user, self.subject, raw_payload)
        asg = Assignment.objects.get(teams_id="teams-asg-102")

        # 2. Student updates status, priority, and adds a subtask
        asg.status = self.status_in_progress
        asg.priority = self.priority_urgent
        asg.save()
        Subtask.objects.create(assignment=asg, title="Personal step 1", is_done=False)

        # 3. Next sync has updated external title and instructions
        updated_payload = [
            {
                "id": "teams-asg-102",
                "displayName": "Updated Title By Professor",
                "instructions": {"content": "Updated instructions with rubric"},
                "dueDateTime": due.isoformat(),
                "webUrl": "https://teams.microsoft.com/102-v2",
            }
        ]
        report = ingest_subject_assignments(self.user, self.subject, updated_payload)
        self.assertEqual(report.created_count, 0)
        self.assertEqual(report.updated_count, 1)

        asg.refresh_from_db()
        # External fields updated
        self.assertEqual(asg.title, "Updated Title By Professor")
        self.assertEqual(asg.instructions, "Updated instructions with rubric")
        self.assertEqual(asg.teams_url, "https://teams.microsoft.com/102-v2")

        # Student-managed fields STRICTLY preserved
        self.assertEqual(asg.status, self.status_in_progress)
        self.assertEqual(asg.priority, self.priority_urgent)
        self.assertEqual(asg.subtasks.count(), 1)
        self.assertEqual(asg.subtasks.first().title, "Personal step 1")

    def test_ingest_deadline_shift_reschedules_reminder(self):
        due_old = timezone.now() + datetime.timedelta(days=2)
        raw_payload = [
            {
                "id": "teams-asg-103",
                "displayName": "Project Proposal",
                "instructions": {"content": "Submit proposal"},
                "dueDateTime": due_old.isoformat(),
                "webUrl": "https://teams.microsoft.com/103",
            }
        ]
        ingest_subject_assignments(self.user, self.subject, raw_payload)
        asg = Assignment.objects.get(teams_id="teams-asg-103")
        reminder_old = Reminder.objects.get(assignment=asg)
        expected_old_remind = due_old - datetime.timedelta(hours=24)
        self.assertAlmostEqual(
            reminder_old.remind_at.timestamp(), expected_old_remind.timestamp(), delta=5
        )

        # Professor extends deadline by 3 days
        due_new = due_old + datetime.timedelta(days=3)
        raw_payload[0]["dueDateTime"] = due_new.isoformat()
        ingest_subject_assignments(self.user, self.subject, raw_payload)

        reminder_new = Reminder.objects.get(assignment=asg)
        expected_new_remind = due_new - datetime.timedelta(hours=24)
        self.assertAlmostEqual(
            reminder_new.remind_at.timestamp(), expected_new_remind.timestamp(), delta=5
        )

    def test_ingest_idempotency_and_cursor_accounting(self):
        due = timezone.now() + datetime.timedelta(days=5)
        raw_payload = [
            {
                "id": "teams-asg-104",
                "displayName": "Quiz 1",
                "instructions": {"content": "MCQ Quiz"},
                "dueDateTime": due.isoformat(),
                "webUrl": "https://teams.microsoft.com/104",
            }
        ]
        # Run 1
        report1 = ingest_subject_assignments(
            self.user, self.subject, raw_payload, delta_token="delta-abc"
        )
        self.assertEqual(report1.created_count, 1)

        # Run 2: Exact same payload
        report2 = ingest_subject_assignments(
            self.user, self.subject, raw_payload, delta_token="delta-xyz"
        )
        self.assertEqual(report2.created_count, 0)
        self.assertEqual(report2.updated_count, 0)
        self.assertEqual(report2.unchanged_count, 1)

        # Zero duplicates
        self.assertEqual(Assignment.objects.filter(teams_id="teams-asg-104").count(), 1)

        # SyncCursor is updated
        cursor = SyncCursor.objects.get(subject=self.subject)
        self.assertEqual(cursor.delta_link_ref, "delta-xyz")
        self.assertIsNotNone(cursor.last_ok_at)

        # SyncRun records exist
        self.assertEqual(SyncRun.objects.filter(user=self.user).count(), 2)

