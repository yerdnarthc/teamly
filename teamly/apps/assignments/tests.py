import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Assignment, Attachment, PersonalNote, Priority, Status, Subtask


class AssignmentsSliceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="assign_user", password="Testpass123!"
        )
        self.status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.status_completed = Status.objects.create(code="COMPLETED", label="Completed")
        self.priority = Priority.objects.create(code="HIGH", rank=3)

    def test_anonymous_assignments_redirects_to_login(self):
        response = self.client.get(reverse("assignments:list"))
        self.assertRedirects(
            response, reverse("login:login") + "?next=/assignments/"
        )

    def test_assignment_str_returns_title(self):
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Lab 1",
        )
        self.assertEqual(str(assignment), "Lab 1")
        self.assertIsNone(assignment.teams_id)

    def test_authenticated_list_displays_assignments(self):
        self.client.login(username="assign_user", password="Testpass123!")
        Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Software Engineering Project",
        )
        response = self.client.get(reverse("assignments:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Software Engineering Project")

    def test_manual_assignment_create(self):
        self.client.login(username="assign_user", password="Testpass123!")
        post_data = {
            "title": "New Milestone Task",
            "status": self.status.pk,
            "priority": self.priority.pk,
            "due_at": "2026-11-20T14:00",
            "instructions": "Write unit tests and verify.",
        }
        response = self.client.post(reverse("assignments:create"), post_data)
        self.assertRedirects(response, reverse("assignments:list"))
        self.assertTrue(Assignment.objects.filter(title="New Milestone Task").exists())
        created = Assignment.objects.get(title="New Milestone Task")
        self.assertEqual(created.source, Assignment.Source.MANUAL)
        self.assertEqual(created.user, self.user)

    def test_assignment_detail_view(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Detailed Assignment",
            instructions="Comprehensive task specs.",
        )
        response = self.client.get(reverse("assignments:detail", args=[assignment.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Detailed Assignment")
        self.assertContains(response, "Comprehensive task specs.")

    def test_assignment_update_status(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Task To Complete",
        )
        response = self.client.post(
            reverse("assignments:update_status", args=[assignment.pk]),
            {"status_code": "COMPLETED"},
        )
        self.assertRedirects(response, reverse("assignments:detail", args=[assignment.pk]))
        assignment.refresh_from_db()
        self.assertEqual(assignment.status.code, "COMPLETED")

    def test_assignment_delete(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Task To Delete",
        )
        response = self.client.post(reverse("assignments:delete", args=[assignment.pk]))
        self.assertRedirects(response, reverse("assignments:list"))
        self.assertFalse(Assignment.objects.filter(pk=assignment.pk).exists())

    def test_subtask_lifecycle(self):
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Project Milestone",
        )
        subtask = Subtask.objects.create(
            assignment=assignment,
            title="Complete Chapter 1 draft",
            sort_order=1,
        )
        self.assertEqual(str(subtask), "Complete Chapter 1 draft")
        self.assertFalse(subtask.is_done)
        subtask.is_done = True
        subtask.save()
        self.assertTrue(assignment.subtasks.filter(is_done=True).exists())

    def test_personal_note_and_attachment(self):
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Research Paper",
        )
        note = PersonalNote.objects.create(
            assignment=assignment,
            body="Remember to check MLA citations.",
        )
        self.assertIn("Research Paper", str(note))
        self.assertEqual(assignment.notes.count(), 1)

        attachment = Attachment.objects.create(
            assignment=assignment,
            label="Project Rubric",
            url_or_drive_id="https://example.com/rubric.pdf",
            kind=Attachment.Kind.RUBRIC,
            added_by=Attachment.AddedBy.TEAMS,
        )
        self.assertEqual(str(attachment), "Project Rubric")
        self.assertEqual(assignment.attachments.count(), 1)

    def test_assignment_workspace_views(self):
        self.client.login(username="assign_user", password="Testpass123!")
        assignment = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Interactive Workspace Assignment",
        )
        # Add subtask
        response = self.client.post(
            reverse("assignments:add_subtask", args=[assignment.pk]),
            {"title": "Review rubric checklist"},
        )
        self.assertRedirects(response, reverse("assignments:detail", args=[assignment.pk]))
        subtask = assignment.subtasks.first()
        self.assertIsNotNone(subtask)
        self.assertFalse(subtask.is_done)

        # Toggle subtask
        response = self.client.post(
            reverse("assignments:toggle_subtask", args=[assignment.pk, subtask.pk])
        )
        self.assertRedirects(response, reverse("assignments:detail", args=[assignment.pk]))
        subtask.refresh_from_db()
        self.assertTrue(subtask.is_done)

        # Add note
        response = self.client.post(
            reverse("assignments:add_note", args=[assignment.pk]),
            {"body": "Discussed with teammate."},
        )
        self.assertRedirects(response, reverse("assignments:detail", args=[assignment.pk]))
        self.assertEqual(assignment.notes.count(), 1)

        # Verify detail page renders them
        detail_res = self.client.get(reverse("assignments:detail", args=[assignment.pk]))
        self.assertContains(detail_res, "Review rubric checklist")
        self.assertContains(detail_res, "Discussed with teammate.")


class AssignmentQuerySetTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="u1", password="pw")
        self.user2 = User.objects.create_user(username="u2", password="pw")
        self.status_pending = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.status_done = Status.objects.create(code="COMPLETED", label="Completed")
        self.priority = Priority.objects.create(code="HIGH", rank=3)

    def test_for_user_and_status_filtering(self):
        now = timezone.now()
        # user1 active upcoming
        a1 = Assignment.objects.create(
            user=self.user1, status=self.status_pending, priority=self.priority,
            title="A1", due_at=now + datetime.timedelta(days=2)
        )
        # user1 active overdue
        a2 = Assignment.objects.create(
            user=self.user1, status=self.status_pending, priority=self.priority,
            title="A2", due_at=now - datetime.timedelta(days=1)
        )
        # user1 completed overdue deadline
        a3 = Assignment.objects.create(
            user=self.user1, status=self.status_done, priority=self.priority,
            title="A3", due_at=now - datetime.timedelta(days=3)
        )
        # user2 assignment (isolation check)
        a_other = Assignment.objects.create(
            user=self.user2, status=self.status_pending, priority=self.priority,
            title="Other", due_at=now + datetime.timedelta(days=1)
        )

        qs = Assignment.objects.for_user(self.user1)
        self.assertEqual(qs.count(), 3)
        self.assertNotIn(a_other, qs)

        # active vs completed
        active_qs = qs.active()
        self.assertIn(a1, active_qs)
        self.assertIn(a2, active_qs)
        self.assertNotIn(a3, active_qs)

        completed_qs = qs.completed()
        self.assertIn(a3, completed_qs)
        self.assertEqual(completed_qs.count(), 1)

        # overdue (must exclude completed)
        overdue_qs = qs.overdue(now=now)
        self.assertEqual(list(overdue_qs), [a2])

        # upcoming (must exclude completed and be in future)
        upcoming_qs = qs.upcoming(now=now)
        self.assertEqual(list(upcoming_qs), [a1])

    def test_workload_metrics_aggregation(self):
        now = timezone.now()
        # 1 overdue pending
        Assignment.objects.create(
            user=self.user1, status=self.status_pending, priority=self.priority,
            title="Overdue", due_at=now - datetime.timedelta(days=2)
        )
        # 1 completed
        Assignment.objects.create(
            user=self.user1, status=self.status_done, priority=self.priority,
            title="Done", due_at=now - datetime.timedelta(days=1)
        )
        # 1 upcoming pending
        Assignment.objects.create(
            user=self.user1, status=self.status_pending, priority=self.priority,
            title="Upcoming", due_at=now + datetime.timedelta(days=3)
        )

        metrics = Assignment.objects.for_user(self.user1).workload_metrics(now=now)
        self.assertEqual(metrics["total_count"], 3)
        self.assertEqual(metrics["completed_count"], 1)
        self.assertEqual(metrics["active_count"], 2)
        self.assertEqual(metrics["overdue_count"], 1)
        self.assertEqual(len(metrics["upcoming_assignments"]), 1)
        self.assertEqual(metrics["upcoming_assignments"][0].title, "Upcoming")
        self.assertEqual(len(metrics["recent_assignments"]), 3)


class SQLShowcaseTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="sql_user", password="Testpass123!")
        self.status = Status.objects.create(code="NOT_STARTED", label="Not Started")
        self.priority = Priority.objects.create(code="HIGH", rank=3)

    def test_sql_showcase_anonymous_redirects(self):
        response = self.client.get(reverse("assignments:sql_showcase"))
        self.assertRedirects(response, reverse("login:login") + "?next=/assignments/sql-showcase/")

    def test_sql_showcase_authenticated_renders_join_and_subquery(self):
        self.client.login(username="sql_user", password="Testpass123!")
        asg1 = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Assignment with Pending Subtask",
        )
        Subtask.objects.create(assignment=asg1, title="Subtask 1", is_done=False)

        asg2 = Assignment.objects.create(
            user=self.user,
            status=self.status,
            priority=self.priority,
            title="Assignment without Subtasks",
        )

        response = self.client.get(reverse("assignments:sql_showcase"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "assignments/sql_showcase.html")

        joined = response.context["joined_assignments"]
        self.assertIn(asg1, joined)
        self.assertIn(asg2, joined)

        subqueried = response.context["subquery_assignments"]
        self.assertIn(asg1, subqueried)
        self.assertNotIn(asg2, subqueried)

        self.assertIn("JOIN", response.context["join_sql"])
        self.assertIn("subtask", response.context["subquery_sql"])






