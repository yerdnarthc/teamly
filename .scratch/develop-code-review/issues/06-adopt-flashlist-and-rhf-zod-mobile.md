# 06: Adopt `FlashList`, `react-hook-form` + `zod`, and Shared Labels

Status: ready-for-agent
Axis: Standards (`docs/TECH_STACK.md` §2.4; `docs/adr/0008` §1; Smell: Duplicated Code / Divergent Change)
Priority: Low

## Target Files
- `teamly-mobile/app/notifications/history.tsx`
- `teamly-mobile/app/sync/history.tsx`
- `teamly-mobile/app/(tabs)/assistant.tsx`
- `teamly-mobile/app/assignment/[id]/edit.tsx`
- `teamly-mobile/app/(tabs)/index.tsx`
- `teamly-mobile/src/constants/assignmentLabels.ts` (new shared constant module)

## Problem
1. `notifications/history.tsx`, `sync/history.tsx`, and `assistant.tsx` render lists via `.map()` inside `ScrollView` instead of `@shopify/flash-list`.
2. `edit.tsx` uses manual `useState` + `validationError` instead of `react-hook-form` + `zod` (check `package.json` and install if missing).
3. `STATUS_LABELS` and `PRIORITY_LABELS` are duplicated across `index.tsx` and `edit.tsx`.

## Target Behaviour
1. Extract `STATUS_LABELS` / `PRIORITY_LABELS` into a shared constant module.
2. Migrate list-heavy screens to `FlashList` and form validation in `edit.tsx` (and `new.tsx` if needed) to `react-hook-form` + `zod`.

## Completion Criteria
- `npx tsc --noEmit` in `teamly-mobile/` exits `0`.
- `npx expo export --platform android --output-dir .tmp-check --clear` succeeds (and `.tmp-check` is removed).

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
