# 07: Align `GLOSSARY.md` Terms & Triage `DESIGN.md` Sharp Geometry

Status: needs-triage
Axis: Standards (`GLOSSARY.md`, `docs/DESIGN.md` §1)
Priority: Low

## Target Files
- `teamly-mobile/app/(tabs)/assistant.tsx`
- `teamly/apps/ai_assistant/advisor.py`
- `docs/DESIGN.md` (if maintainer opts to scope sharp geometry to web only)

## Problem
1. `assistant.tsx` and `advisor.py` use `"Suggested Study Tasks"`, `"starting new tasks"`, and `total_suggested_tasks` instead of `GLOSSARY.md` terms (`Assignment`, `Subtask`, `AI Task Suggestion`).
2. `docs/DESIGN.md` §1 specifies *Sharp Geometry* (`border-radius: 0`), whereas `teamly-mobile` uses `rounded-2xl` / `rounded-3xl` / `rounded-full` across all screens.

## Target Behaviour
1. Rename `"task"` copy in `assistant.tsx` and `advisor.py` to `Subtask` / `Assignment` / `AI Study Suggestions` (preserving API contract or updating tests/clients together).
2. Maintainer triage decision needed: either update `teamly-mobile` components to `border-radius: 0` per `DESIGN.md`, or amend `DESIGN.md` to document mobile's rounded card/pill tokens.

## Completion Criteria
- Maintainer decision recorded in `## Comments` (and `Status:` updated to `ready-for-agent` or `wontfix` for the geometry part).
- `npx tsc --noEmit` and `..\.venv\Scripts\python.exe manage.py test apps.ai_assistant --keepdb` pass.

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
