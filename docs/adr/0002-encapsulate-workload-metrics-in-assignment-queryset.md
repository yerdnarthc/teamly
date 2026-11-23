# 0002. Encapsulate Workload Metrics in Assignment QuerySet

**Status**: accepted  
**Date**: 2026-11-23  

## Context

Previously, the dashboard view (`apps.home.views.home_view`) directly crafted six separate, disjointed ORM queries to compute total, completed, active, overdue, and upcoming assignments. This coupled dashboard presentation to raw status codes (`COMPLETED`), timestamp comparisons, and limit ordering. Callers (the current Django web view and future REST API endpoints for mobile) had no shared, reusable mechanism to query workload metrics, resulting in zero locality and a wide, leaky interface.

## Decision

We deepened the `assignments` module by introducing a custom `AssignmentQuerySet` (attached via `AssignmentQuerySet.as_manager()` on `Assignment.objects`):

1. **Composable Filters:** Exposed `.for_user(user)`, `.active()`, `.completed()`, `.overdue(now=None)`, `.upcoming(now=None, limit=None)`, and `.recent(limit=None)` as chained queryset methods.
2. **Workload Metrics Aggregation:** Added `.workload_metrics(now=None)` to compute consolidated metrics behind a single method call with high leverage.
3. **Slim Caller Interface:** Refactored `apps.home.views.home_view` to a single call: `Assignment.objects.for_user(request.user).workload_metrics()`.

## Consequences

- The `apps.assignments` query interface is deepened: complex filtering rules, timezone defaults, and `select_related` query optimizations are completely encapsulated inside `AssignmentQuerySet`.
- Dashboard view implementation shrunk from 35 lines of disjoint queries to 2 lines of code.
- Future mobile REST API endpoints can reuse `.workload_metrics()` directly with zero duplicate logic.
- Workload and status rules are independently verified by unit tests without requiring HTTP round-trips.
