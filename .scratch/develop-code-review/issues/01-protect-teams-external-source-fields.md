# 01: Protect `TEAMS` External Source Fields from Overwrite

Status: resolved
Axis: Spec (Implemented Wrong — `PROJECT_CONTEXT.md` Data Ownership & §5)
Priority: High

## Target Files
- `teamly/apps/assignments/serializers.py` (`AssignmentCreateUpdateSerializer`)
- `teamly-mobile/app/assignment/[id]/edit.tsx`
- `teamly/apps/assignments/test_api.py`

## Problem
`AssignmentCreateUpdateSerializer` and `edit.tsx` allow mutating `title`, `instructions`, and `due_at` on assignments where `source == "TEAMS"`. Per `PROJECT_CONTEXT.md` (*Data Ownership & Source of Truth* and §5), external source data from Microsoft Teams is immutable; only Teamly-managed fields (`status`, `priority`, `subject`, personal notes, subtasks) may be edited.

## Target Behaviour
1. In `AssignmentCreateUpdateSerializer.update()`, reject or ignore edits to `title`, `instructions`, and `due_at` when `instance.source == Assignment.Source.TEAMS` (raise `ValidationError` on explicit attempts or lock external fields cleanly).
2. In `edit.tsx`, render `title`, `instructions`, and `due_at` as read-only when `assignment.source === "TEAMS"` while keeping `status`, `priority`, and `subject` editable.
3. Add an API regression test in `teamly/apps/assignments/test_api.py` asserting `TEAMS` external fields remain immutable on `PATCH`.

## Completion Criteria
- `..\.venv\Scripts\python.exe manage.py test apps.assignments.test_api --keepdb` passes including the new immutability test.
- `npx tsc --noEmit` in `teamly-mobile/` exits `0`.

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
- 2026-11-25: Resolved — enforced `EXTERNAL_TEAMS_FIELDS` immutability in `AssignmentCreateUpdateSerializer.validate`, locked external fields to read-only in `edit.tsx`, and added `test_teams_assignment_external_fields_are_immutable` (18/18 tests passing, `tsc --noEmit` 0).
