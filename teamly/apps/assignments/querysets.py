from django.db import models
from django.db.models import F, Q
from django.utils import timezone


PRIORITY_ALIASES = {"MED": "MEDIUM", "MEDIUM": "MED"}


def expand_priority_codes(priority_code: str) -> list[str]:
    """Returns canonical and aliased priority codes for uniform lookup/filtering."""
    alias = PRIORITY_ALIASES.get(priority_code)
    return [priority_code, alias] if alias else [priority_code]


def serialize_assignment_brief(assignment, include_due_at: bool = False) -> dict | None:
    """Shared brief assignment representation for sync and notification logs."""
    if assignment is None:
        return None
    data = {
        "id": assignment.id,
        "title": assignment.title,
        "subject_name": assignment.subject.name if assignment.subject else None,
        "subject_color": assignment.subject.color if assignment.subject else None,
    }
    if include_due_at:
        data["due_at"] = assignment.due_at
    return data


class AssignmentQuerySet(models.QuerySet):
    """Custom queryset encapsulating assignment filtering and workload metrics."""

    def for_user(self, user):
        return self.filter(user=user)

    def search(self, query: str):
        cleaned = (query or "").strip()
        if not cleaned:
            return self
        return self.filter(
            Q(title__icontains=cleaned)
            | Q(instructions__icontains=cleaned)
            | Q(subject__name__icontains=cleaned)
        )

    def filter_by_params(
        self,
        *,
        upcoming: bool = False,
        search_query: str = "",
        status_code: str | None = None,
        subject_id: str | int | None = None,
        priority_code: str | None = None,
    ):
        qs = self
        if upcoming:
            qs = qs.active().filter(due_at__isnull=False).order_by("due_at")
        else:
            qs = qs.order_by(F("due_at").asc(nulls_last=True), "-updated_at", "-id")

        if search_query:
            qs = qs.search(search_query)
        if status_code:
            qs = qs.filter(status__code=status_code)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if priority_code:
            qs = qs.filter(priority__code__in=expand_priority_codes(priority_code))
        return qs

    def active(self):
        return self.exclude(status__code="COMPLETED")

    def completed(self):
        return self.filter(status__code="COMPLETED")

    def overdue(self, now=None):
        if now is None:
            now = timezone.now()
        return self.active().filter(due_at__lt=now).order_by("due_at")

    def upcoming(self, now=None, limit=None):
        if now is None:
            now = timezone.now()
        qs = (
            self.active()
            .filter(due_at__gte=now)
            .select_related("subject", "status", "priority")
            .order_by("due_at")
        )
        if limit:
            return qs[:limit]
        return qs

    def recent(self, limit=None):
        qs = self.select_related("subject", "status", "priority").order_by("-updated_at")
        if limit:
            return qs[:limit]
        return qs

    def workload_metrics(self, now=None):
        """Computes consolidated workload statistics and slices behind a single interface."""
        if now is None:
            now = timezone.now()

        return {
            "total_count": self.count(),
            "completed_count": self.completed().count(),
            "active_count": self.active().count(),
            "overdue_count": self.overdue(now=now).count(),
            "upcoming_assignments": self.upcoming(now=now, limit=5),
            "recent_assignments": self.recent(limit=4),
        }

