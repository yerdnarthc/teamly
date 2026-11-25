from datetime import timedelta
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import AcademicTerm, Subject
from apps.ai_assistant.advisor import analyze_assignment
from apps.assignments.models import Assignment, Priority, Status, Subtask


class AssignmentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="student_api", password="Password123!"
        )
        self.other_user = User.objects.create_user(
            username="other_student", password="Password123!"
        )

        # Authenticate via JWT for all requests
        self.client.force_authenticate(user=self.user)

        self.status_todo, _ = Status.objects.get_or_create(
            code="NOT_STARTED", defaults={"label": "Not Started"}
        )
        self.status_in_progress, _ = Status.objects.get_or_create(
            code="IN_PROGRESS", defaults={"label": "In Progress"}
        )
        self.status_done, _ = Status.objects.get_or_create(
            code="COMPLETED", defaults={"label": "Completed"}
        )
        self.priority_high, _ = Priority.objects.get_or_create(
            code="HIGH", defaults={"rank": 1}
        )
        self.priority_med, _ = Priority.objects.get_or_create(
            code="MED", defaults={"rank": 2}
        )

        self.term, _ = AcademicTerm.objects.get_or_create(
            name="First Term 2026", defaults={"starts_on": "2026-01-01", "ends_on": "2026-06-30"}
        )
        self.subject, _ = Subject.objects.get_or_create(
            user=self.user, term=self.term, name="CS 101", color="#3B82F6", teams_group_id="teams_cs101"
        )

        self.assignment = Assignment.objects.create(
            user=self.user,
            subject=self.subject,
            status=self.status_todo,
            priority=self.priority_high,
            title="Implement Sorting Algorithm",
            instructions="1. Implement Quicksort.\n2. Write unit tests.\n3. Benchmark performance.",
            due_at=timezone.now() + timedelta(days=2),
        )

        self.subtask = Subtask.objects.create(
            assignment=self.assignment,
            title="Setup test scaffolding",
            is_done=False,
        )

        # Another user's assignment (for security scoping checks)
        self.other_assignment = Assignment.objects.create(
            user=self.other_user,
            status=self.status_todo,
            priority=self.priority_med,
            title="Other Student Secret Assignment",
        )

    def test_list_assignments_scoped_to_user(self):
        url = reverse("api_v1_assignments:assignment-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        # Should only see own assignment, never other_user's
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        titles = [a["title"] for a in results]
        self.assertIn("Implement Sorting Algorithm", titles)
        self.assertNotIn("Other Student Secret Assignment", titles)

    def test_retrieve_assignment_detail_with_subtasks_and_ai(self):
        # Generate AI summary to test embedded AI details
        analyze_assignment(self.assignment)

        url = reverse("api_v1_assignments:assignment-detail", args=[self.assignment.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Implement Sorting Algorithm")
        self.assertEqual(response.data["status"]["code"], "NOT_STARTED")
        self.assertEqual(response.data["priority"]["code"], "HIGH")
        self.assertEqual(len(response.data["subtasks"]), 1)
        self.assertEqual(response.data["subtasks"][0]["title"], "Setup test scaffolding")
        self.assertIsNotNone(response.data["ai_summary"])
        self.assertIn("suggested_subtasks", response.data["ai_summary"])

    def test_retrieve_other_user_assignment_forbidden_or_404(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.other_assignment.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_create_assignment_scoped_to_request_user(self):
        url = reverse("api_v1_assignments:assignment-list")
        payload = {
            "title": "New Mobile Assignment",
            "instructions": "Study chapter 4",
            "subject_id": self.subject.id,
            "status_code": "NOT_STARTED",
            "priority_code": "HIGH",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        created_id = response.data["id"]
        created = Assignment.objects.get(id=created_id)
        self.assertEqual(created.user, self.user)
        self.assertEqual(created.title, "New Mobile Assignment")

    def test_update_assignment_status(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.assignment.id])
        response = self.client.patch(url, {"status_code": "COMPLETED"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status.code, "COMPLETED")

    def test_toggle_subtask_completion(self):
        url = reverse("api_v1_assignments:subtask-toggle", args=[self.subtask.id])
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.subtask.refresh_from_db()
        self.assertTrue(self.subtask.is_done)

        # Toggle back
        response = self.client.post(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.subtask.refresh_from_db()
        self.assertFalse(self.subtask.is_done)

    def test_adopt_suggested_ai_subtask(self):
        url = reverse(
            "api_v1_assignments:assignment-adopt-subtask", args=[self.assignment.id]
        )
        payload = {"title": "Benchmark performance"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Subtask.objects.filter(
                assignment=self.assignment, title="Benchmark performance"
            ).exists()
        )

    def test_list_upcoming_assignments(self):
        # Create an assignment due tomorrow, one due next week, and a completed one
        Assignment.objects.create(
            user=self.user,
            status=self.status_todo,
            priority=self.priority_med,
            title="Due Tomorrow Task",
            due_at=timezone.now() + timedelta(days=1),
        )
        Assignment.objects.create(
            user=self.user,
            status=self.status_done,
            priority=self.priority_med,
            title="Completed Task (Should be excluded)",
            due_at=timezone.now() + timedelta(days=1),
        )
        url = reverse("api_v1_assignments:assignment-list") + "?upcoming=true"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        titles = [a["title"] for a in response.data]
        self.assertIn("Due Tomorrow Task", titles)
        self.assertIn("Implement Sorting Algorithm", titles)
        self.assertNotIn("Completed Task (Should be excluded)", titles)
        # Verify chronological ordering
        self.assertEqual(titles[0], "Due Tomorrow Task")
        self.assertEqual(titles[1], "Implement Sorting Algorithm")

    def test_get_workload_metrics(self):
        url = reverse("api_v1_assignments:assignment-metrics")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("total_count", response.data)
        self.assertIn("completed_count", response.data)
        self.assertIn("active_count", response.data)
        self.assertIn("overdue_count", response.data)
        self.assertEqual(response.data["total_count"], 1)
        self.assertEqual(response.data["active_count"], 1)
        self.assertEqual(response.data["completed_count"], 0)

    def test_partial_update_assignment_fields_and_clear_optional_fields(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.assignment.id])
        new_due = (timezone.now() + timedelta(days=5)).replace(microsecond=0)
        response = self.client.patch(
            url,
            {
                "title": "Updated Sorting Algorithm",
                "instructions": "Updated rubric notes.",
                "due_at": new_due.isoformat(),
                "priority_code": "MEDIUM",
                "status_code": "IN_PROGRESS",
                "subject_id": None,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.title, "Updated Sorting Algorithm")
        self.assertEqual(self.assignment.instructions, "Updated rubric notes.")
        self.assertEqual(self.assignment.due_at, new_due)
        self.assertEqual(self.assignment.priority.code, "MED")
        self.assertIsNone(self.assignment.subject)

        # Clear due_at to null
        clear_resp = self.client.patch(url, {"due_at": None}, format="json")
        self.assertEqual(clear_resp.status_code, 200)
        self.assignment.refresh_from_db()
        self.assertIsNone(self.assignment.due_at)

    def test_update_other_user_assignment_returns_404(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.other_assignment.id])
        response = self.client.patch(url, {"title": "Hijacked Title"}, format="json")
        self.assertEqual(response.status_code, 404)
        self.other_assignment.refresh_from_db()
        self.assertEqual(self.other_assignment.title, "Other Student Secret Assignment")

    def test_delete_own_assignment_returns_204(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.assignment.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Assignment.objects.filter(id=self.assignment.id).exists())

    def test_delete_other_user_assignment_returns_404(self):
        url = reverse("api_v1_assignments:assignment-detail", args=[self.other_assignment.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Assignment.objects.filter(id=self.other_assignment.id).exists())

    def test_search_assignments_by_keyword_q(self):
        Assignment.objects.create(
            user=self.user,
            status=self.status_in_progress,
            priority=self.priority_med,
            title="Database Indexing Lab",
            instructions="Benchmark B-tree vs hash index.",
        )
        url = reverse("api_v1_assignments:assignment-list")

        # Match by title
        resp_title = self.client.get(url, {"q": "sorting"})
        self.assertEqual(resp_title.status_code, 200)
        titles = [a["title"] for a in resp_title.data]
        self.assertEqual(titles, ["Implement Sorting Algorithm"])

        # Match by instructions
        resp_instr = self.client.get(url, {"q": "B-tree"})
        self.assertEqual(resp_instr.status_code, 200)
        self.assertEqual([a["title"] for a in resp_instr.data], ["Database Indexing Lab"])

        # Match by subject name
        resp_subj = self.client.get(url, {"q": "CS 101"})
        self.assertEqual(resp_subj.status_code, 200)
        self.assertEqual([a["title"] for a in resp_subj.data], ["Implement Sorting Algorithm"])

    def test_filter_assignments_combined_status_priority_and_subject(self):
        Assignment.objects.create(
            user=self.user,
            status=self.status_in_progress,
            priority=self.priority_med,
            title="Database Indexing Lab",
        )
        url = reverse("api_v1_assignments:assignment-list")

        resp = self.client.get(
            url,
            {
                "status": "IN_PROGRESS",
                "priority": "MEDIUM",
                "q": "Indexing",
            },
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual([a["title"] for a in resp.data], ["Database Indexing Lab"])

        resp_subj = self.client.get(
            url,
            {"subject": self.subject.id, "status": "NOT_STARTED", "priority": "HIGH"},
        )
        self.assertEqual(resp_subj.status_code, 200)
        self.assertEqual([a["title"] for a in resp_subj.data], ["Implement Sorting Algorithm"])

    def test_create_update_complete_assignment_manages_reminder(self):
        from datetime import timedelta
        from django.utils import timezone
        from apps.notifications.models import Reminder

        due_1 = (timezone.now() + timedelta(days=3)).replace(microsecond=0)
        create_resp = self.client.post(
            reverse("api_v1_assignments:assignment-list"),
            {
                "title": "Reminder Hook Test",
                "due_at": due_1.isoformat(),
                "status_code": "NOT_STARTED",
                "priority_code": "HIGH",
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        assignment_id = create_resp.data["id"]
        reminder = Reminder.objects.get(assignment_id=assignment_id, is_sent=False)
        self.assertEqual(reminder.remind_at, due_1 - timedelta(hours=24))

        due_2 = (timezone.now() + timedelta(days=5)).replace(microsecond=0)
        detail_url = reverse("api_v1_assignments:assignment-detail", args=[assignment_id])
        patch_due = self.client.patch(
            detail_url,
            {"due_at": due_2.isoformat()},
            format="json",
        )
        self.assertEqual(patch_due.status_code, 200)
        reminder.refresh_from_db()
        self.assertEqual(reminder.remind_at, due_2 - timedelta(hours=24))

        patch_done = self.client.patch(
            detail_url,
            {"status_code": "COMPLETED"},
            format="json",
        )
        self.assertEqual(patch_done.status_code, 200)
        self.assertFalse(
            Reminder.objects.filter(assignment_id=assignment_id, is_sent=False).exists()
        )

    def test_default_ordering_chronological_due_at_nulls_last(self):
        from datetime import timedelta
        from django.utils import timezone

        now = timezone.now()
        self.assignment.due_at = now + timedelta(days=5)
        self.assignment.save(update_fields=["due_at"])

        Assignment.objects.create(
            user=self.user,
            title="Undated Task",
            due_at=None,
            status=self.status_todo,
            priority=self.priority_med,
        )
        Assignment.objects.create(
            user=self.user,
            title="Sooner Task",
            due_at=now + timedelta(days=1),
            status=self.status_todo,
            priority=self.priority_high,
        )

        resp = self.client.get(reverse("api_v1_assignments:assignment-list"))
        self.assertEqual(resp.status_code, 200)
        titles = [item["title"] for item in resp.data]
        self.assertEqual(titles, ["Sooner Task", self.assignment.title, "Undated Task"])

    def test_teams_assignment_external_fields_are_immutable(self):
        from datetime import timedelta
        from django.utils import timezone

        due_1 = (timezone.now() + timedelta(days=2)).replace(microsecond=0)
        due_2 = (timezone.now() + timedelta(days=6)).replace(microsecond=0)
        teams_asg = Assignment.objects.create(
            user=self.user,
            title="Teams Official Lab",
            instructions="Original professor rubric.",
            due_at=due_1,
            source=Assignment.Source.TEAMS,
            teams_id="teams-ext-001",
            status=self.status_todo,
            priority=self.priority_med,
        )
        detail_url = reverse("api_v1_assignments:assignment-detail", args=[teams_asg.id])

        # Attempting to mutate external fields must be rejected
        bad_resp = self.client.patch(
            detail_url,
            {
                "title": "Tampered Title",
                "instructions": "Tampered instructions",
                "due_at": due_2.isoformat(),
                "status_code": "IN_PROGRESS",
            },
            format="json",
        )
        self.assertEqual(bad_resp.status_code, 400)
        teams_asg.refresh_from_db()
        self.assertEqual(teams_asg.title, "Teams Official Lab")
        self.assertEqual(teams_asg.instructions, "Original professor rubric.")
        self.assertEqual(teams_asg.due_at, due_1)

        # Updating only Teamly-managed fields succeeds
        ok_resp = self.client.patch(
            detail_url,
            {
                "status_code": "IN_PROGRESS",
                "priority_code": "HIGH",
            },
            format="json",
        )
        self.assertEqual(ok_resp.status_code, 200)
        teams_asg.refresh_from_db()
        self.assertEqual(teams_asg.status.code, "IN_PROGRESS")
        self.assertEqual(teams_asg.priority.code, "HIGH")

    def test_assignment_sorting_options(self):
        from datetime import timedelta
        from django.utils import timezone
        from apps.academic.models import AcademicTerm, Subject

        now = timezone.now()
        term, _ = AcademicTerm.objects.get_or_create(
            name="Sort Term 2026",
            defaults={"starts_on": "2026-01-01", "ends_on": "2026-06-30"},
        )
        subj_a, _ = Subject.objects.get_or_create(
            user=self.user,
            term=term,
            name="Algorithms",
            defaults={"color": "#2563EB", "teams_group_id": "teams_alg_sort"},
        )
        subj_z, _ = Subject.objects.get_or_create(
            user=self.user,
            term=term,
            name="Zoology",
            defaults={"color": "#10B981", "teams_group_id": "teams_zoo_sort"},
        )

        self.assignment.due_at = now + timedelta(days=5)
        self.assignment.subject = subj_z
        self.assignment.priority = self.priority_med
        self.assignment.save()

        asg_high = Assignment.objects.create(
            user=self.user,
            title="High Priority Early",
            due_at=now + timedelta(days=1),
            subject=subj_a,
            status=self.status_done,
            priority=self.priority_high,
        )

        url = reverse("api_v1_assignments:assignment-list")

        # due_desc (nulls last)
        resp_desc = self.client.get(url, {"sort": "due_desc"})
        self.assertEqual(resp_desc.status_code, 200)
        self.assertEqual(
            [a["title"] for a in resp_desc.data],
            [self.assignment.title, asg_high.title],
        )

        # priority (highest rank first)
        resp_prio = self.client.get(url, {"sort": "priority"})
        self.assertEqual(resp_prio.status_code, 200)
        self.assertEqual(
            [a["title"] for a in resp_prio.data],
            [asg_high.title, self.assignment.title],
        )

        # subject (alphabetical by subject name)
        resp_subj = self.client.get(url, {"sort": "subject"})
        self.assertEqual(resp_subj.status_code, 200)
        self.assertEqual(
            [a["title"] for a in resp_subj.data],
            [asg_high.title, self.assignment.title],
        )

        # status (alphabetical by status label: Completed before Not Started)
        resp_status = self.client.get(url, {"sort": "status"})
        self.assertEqual(resp_status.status_code, 200)
        self.assertEqual(
            [a["title"] for a in resp_status.data],
            [asg_high.title, self.assignment.title],
        )


