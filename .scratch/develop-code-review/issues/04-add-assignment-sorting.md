# 04: Add User-Selectable Assignment Sorting

Status: resolved
Axis: Spec (`PROJECT_CONTEXT.md` §5 Assignment Filtering & Sorting)
Priority: Medium

## Target Files
- `teamly/apps/assignments/views_api.py` (or `AssignmentQuerySet`)
- `teamly/apps/assignments/test_api.py`
- `teamly-mobile/src/stores/assignmentFilterStore.ts`
- `teamly-mobile/app/modal/filter.tsx`
- `teamly-mobile/app/(tabs)/index.tsx`

## Problem
`AssignmentViewSet` and `modal/filter.tsx` support filtering and keyword search only, with hardcoded `due_at` ordering and no user-selectable sort option (by deadline, priority, subject, or status).

## Target Behaviour
1. Support a `sort` query param on `GET /api/v1/assignments/` (e.g. `due_asc`, `due_desc`, `priority`, `subject`, `status`) with deterministic nulls-last ordering.
2. Add a sort selector to `assignmentFilterStore.ts` and `modal/filter.tsx`, and pass `sort` in `index.tsx`.
3. Add API tests in `teamly/apps/assignments/test_api.py` covering sort options.

## Completion Criteria
- `..\.venv\Scripts\python.exe manage.py test apps.assignments.test_api --keepdb` passes.
- `npx tsc --noEmit` in `teamly-mobile/` exits `0`.

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
- 2026-11-25: Resolved — added `SORT_ORDERINGS` (`due_asc`, `due_desc`, `priority`, `subject`, `status`) to `AssignmentQuerySet`, wired `sort` in `AssignmentViewSet`, `assignmentFilterStore.ts`, `modal/filter.tsx`, and `index.tsx`, and verified with `test_assignment_sorting_options` + `tsc --noEmit` 0.
