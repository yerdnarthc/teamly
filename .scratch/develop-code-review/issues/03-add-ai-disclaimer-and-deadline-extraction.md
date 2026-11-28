# 03: Add AI Assistance Disclaimer & Deadline Extraction

Status: resolved
Axis: Spec (`PROJECT_CONTEXT.md` §4 AI Assignment Assistant & Security Principles)
Priority: Medium

## Target Files
- `teamly/apps/ai_assistant/advisor.py`
- `teamly/apps/ai_assistant/views_api.py` (or service from Ticket 02)
- `teamly/apps/ai_assistant/test_api.py`
- `teamly-mobile/app/(tabs)/assistant.tsx`
- `teamly-mobile/app/assignment/[id].tsx`

## Problem
1. `assistant.tsx` and `assignment/[id].tsx` omit an explicit AI assistance disclaimer stating that AI summaries/suggestions are assistive and do not replace professor-provided instructions.
2. `DeterministicAiAdapter` hardcodes `"deadlines": []` and `serialize_workspace_summary` omits `deadlines`.

## Target Behaviour
1. Display a clear, concise AI assistance disclaimer banner in both `assistant.tsx` and the AI section of `assignment/[id].tsx`.
2. Extract date/time hints from assignment instructions in `DeterministicAiAdapter` (`advisor.py`) and include `deadlines` in the workspace summary response and UI.
3. Add a test in `teamly/apps/ai_assistant/test_api.py` verifying `deadlines` extraction and serialization.

## Completion Criteria
- `..\.venv\Scripts\python.exe manage.py test apps.ai_assistant --keepdb` passes.
- `npx tsc --noEmit` in `teamly-mobile/` exits `0`.

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
- 2026-11-25: Resolved — implemented `_extract_deadline_hints` in `advisor.py`, exposed `deadlines` in `serialize_workspace_summary`, added AI disclaimer banners and date-hint chips in `assistant.tsx` and `assignment/[id].tsx`, and verified with 13 passing `apps.ai_assistant` tests + `tsc --noEmit` 0.
