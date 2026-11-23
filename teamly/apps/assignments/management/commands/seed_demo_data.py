import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.assignments.models import (
    Assignment,
    Attachment,
    PersonalNote,
    Priority,
    Status,
    Subtask,
)
from apps.academic.models import AcademicTerm, Subject
from apps.profile.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds initial statuses, priorities, and realistic demo student data for Teamly."

    def handle(self, *args, **options):
        # 1. Statuses
        statuses = [
            ("NOT_STARTED", "Not Started"),
            ("IN_PROGRESS", "In Progress"),
            ("COMPLETED", "Completed"),
        ]
        for code, label in statuses:
            Status.objects.get_or_create(code=code, defaults={"label": label})
        self.stdout.write(self.style.SUCCESS("Statuses seeded."))

        # 2. Priorities
        priorities = [
            ("LOW", 1),
            ("MEDIUM", 2),
            ("HIGH", 3),
            ("URGENT", 4),
        ]
        for code, rank in priorities:
            Priority.objects.get_or_create(code=code, defaults={"rank": rank})
        self.stdout.write(self.style.SUCCESS("Priorities seeded."))

        # 3. Demo User
        user, created = User.objects.get_or_create(
            username="student_demo",
            defaults={
                "email": "student@teamly.edu",
                "first_name": "Arth Andrey",
                "last_name": "Endrina",
            },
        )
        user.set_password("TeamlyPassword123!")
        user.save()

        Profile.objects.update_or_create(
            user=user,
            defaults={
                "first_name": "Arth Andrey",
                "middle_name": "C.",
                "last_name": "Endrina",
                "bio": "CSIT327 - F1 student working on Teamly Academic Assistant.",
            },
        )
        self.stdout.write(self.style.SUCCESS("Demo user 'student_demo' configured."))

        # 4. Academic Term & Subjects
        term, _ = AcademicTerm.objects.get_or_create(
            name="1st Sem AY 2026-2027",
            defaults={
                "starts_on": datetime.date(2026, 8, 15),
                "ends_on": datetime.date(2026, 12, 18),
                "is_active": True,
            },
        )

        subj_csit327, _ = Subject.objects.get_or_create(
            user=user,
            teams_group_id="teams-csit327-f1",
            defaults={
                "term": term,
                "name": "CSIT327 - Software Engineering",
                "color": "#2563EB",
            },
        )
        subj_csit321, _ = Subject.objects.get_or_create(
            user=user,
            teams_group_id="teams-csit321-f1",
            defaults={
                "term": term,
                "name": "CSIT321 - Web Systems and Technologies",
                "color": "#16A34A",
            },
        )
        subj_math201, _ = Subject.objects.get_or_create(
            user=user,
            teams_group_id="teams-math201-f1",
            defaults={
                "term": term,
                "name": "MATH201 - Advanced Discrete Mathematics",
                "color": "#D97706",
            },
        )
        self.stdout.write(self.style.SUCCESS("Academic term & subjects seeded."))

        # 5. Assignments
        now = timezone.now()
        status_not_started = Status.objects.get(code="NOT_STARTED")
        status_in_progress = Status.objects.get(code="IN_PROGRESS")
        status_completed = Status.objects.get(code="COMPLETED")

        prio_low = Priority.objects.get(code="LOW")
        prio_med = Priority.objects.get(code="MEDIUM")
        prio_high = Priority.objects.get(code="HIGH")
        prio_urgent = Priority.objects.get(code="URGENT")

        sample_assignments = [
            {
                "title": "Milestone 1: Vertical Slice Implementation",
                "subject": subj_csit327,
                "status": status_in_progress,
                "priority": prio_high,
                "due_at": now + datetime.timedelta(days=2),
                "instructions": "Implement Django models, views, templates, and tests for the core vertical slice.",
            },
            {
                "title": "Lab Exercise 4: Django REST APIs",
                "subject": subj_csit321,
                "status": status_not_started,
                "priority": prio_med,
                "due_at": now + datetime.timedelta(days=5),
                "instructions": "Construct DRF serializers and endpoints with proper pagination and error handling.",
            },
            {
                "title": "Problem Set 3: Graph Theory & Trees",
                "subject": subj_math201,
                "status": status_completed,
                "priority": prio_low,
                "due_at": now - datetime.timedelta(days=1),
                "instructions": "Submit solutions for problem set 3 in PDF format via Microsoft Teams.",
            },
            {
                "title": "Final Project Development & Monitoring Submission",
                "subject": subj_csit327,
                "status": status_in_progress,
                "priority": prio_urgent,
                "due_at": now + datetime.timedelta(hours=1),
                "instructions": "Package git evidence, screenshots, and submission ZIP for CSIT327 session monitoring.",
            },
        ]

        for item in sample_assignments:
            asg, _ = Assignment.objects.get_or_create(
                user=user,
                title=item["title"],
                defaults=item,
            )
            if item["title"] == "Milestone 1: Vertical Slice Implementation":
                Subtask.objects.get_or_create(assignment=asg, title="Define ERD physical schemas and models", defaults={"is_done": True, "sort_order": 1})
                Subtask.objects.get_or_create(assignment=asg, title="Wire URLconfs into vertical slices", defaults={"is_done": True, "sort_order": 2})
                Subtask.objects.get_or_create(assignment=asg, title="Implement student workspace detail view", defaults={"is_done": False, "sort_order": 3})
                Subtask.objects.get_or_create(assignment=asg, title="Write comprehensive unit tests", defaults={"is_done": False, "sort_order": 4})

                PersonalNote.objects.get_or_create(assignment=asg, body="Confirmed with Prof: models should use explicit db_table naming matching physical ERD.")
                PersonalNote.objects.get_or_create(assignment=asg, body="Remember to test non-destructive migrations before committing.")

                Attachment.objects.get_or_create(assignment=asg, label="Project Specification & Rubric PDF", defaults={"url_or_drive_id": "https://teams.microsoft.com/l/file/spec.pdf", "kind": Attachment.Kind.RUBRIC, "added_by": Attachment.AddedBy.TEAMS})
                Attachment.objects.get_or_create(assignment=asg, label="Personal Architecture Notes", defaults={"url_or_drive_id": "https://github.com/yerdnarthc/teamly/blob/develop/docs/DESIGN.md", "kind": Attachment.Kind.LINK, "added_by": Attachment.AddedBy.USER})

        self.stdout.write(self.style.SUCCESS("Sample assignments seeded successfully."))
