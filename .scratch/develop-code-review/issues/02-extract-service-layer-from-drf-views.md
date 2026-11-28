# 02: Extract Domain Services from DRF Views & Deduplicate Helpers

Status: resolved
Axis: Standards (`AGENTS.md` Coexisting Hybrid Model; `docs/TECH_STACK.md` §3.2; `docs/adr/0008` §2)
Priority: High

## Target Files
- `teamly/apps/ai_assistant/views_api.py` -> `teamly/apps/ai_assistant/advisor.py`
- `teamly/apps/sync/views_api.py` -> `teamly/apps/sync/` service module
- `teamly/apps/notifications/views_api.py` -> `teamly/apps/notifications/services.py`
- `teamly/apps/assignments/views_api.py` -> `teamly/apps/assignments/models.py` (`AssignmentQuerySet`) & `serializers.py`

## Problem
1. DRF views directly execute domain queries, filtering, validation, and payload assembly instead of delegating to domain service modules / `AssignmentQuerySet`.
2. `MED`/`MEDIUM` priority alias mapping is duplicated in `assignments/serializers.py` and `assignments/views_api.py`.
3. Brief assignment serialization is duplicated between `notifications/views_api.py` (`_serialize_assignment_brief`) and `sync/views_api.py` (`SyncHistoryApiView.get`).
4. `AssistantFeedbackApiView.post` accepts unused `corrected_text`.

## Target Behaviour
1. Move workspace assembly, feedback recording, sync diagnostics assembly, notification history/dismissal, and assignment search/filter queryset logic into their respective service modules / `AssignmentQuerySet`.
2. Centralize `PRIORITY_ALIASES` in one shared helper/constant and share one brief assignment serializer helper.
3. Remove unused `corrected_text` handling unless required by a test/spec.

## Completion Criteria
- `..\.venv\Scripts\python.exe manage.py check` exits `0`.
- `..\.venv\Scripts\python.exe manage.py test apps.ai_assistant apps.sync apps.notifications apps.assignments --keepdb` passes with zero regressions.

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
- 2026-11-25: Resolved — extracted domain service functions and queryset helpers across `ai_assistant/advisor.py`, `sync/services.py`, `notifications/services.py`, and `assignments/querysets.py`; consolidated `expand_priority_codes` and `serialize_assignment_brief`; removed unused `corrected_text` handling. Verified with `manage.py check` (0 issues) and 68 tests passing.
