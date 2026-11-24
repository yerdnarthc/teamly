from django.db import models
from django.utils import timezone


class AssignmentQuerySet(models.QuerySet):
    """Custom queryset encapsulating assignment filtering and workload metrics."""

    def for_user(self, user):
        return self.filter(user=user)

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

