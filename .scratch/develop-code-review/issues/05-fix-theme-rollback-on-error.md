# 05: Roll Back `useThemeStore` on Non-Abort API Errors

Status: ready-for-agent
Axis: Spec (`docs/adr/0009-client-side-interaction-coalescing-and-railguards.md`)
Priority: Medium

## Target Files
- `teamly-mobile/src/stores/themeStore.ts`

## Problem
`useThemeStore.setTheme` currently retains the optimistic local `theme` in its `catch` block even when `PATCH /auth/preferences/` fails with a non-abort error, diverging from `ADR-0009` ("Restores the last confirmed server snapshot on real failures").

## Target Behaviour
1. In `themeStore.ts`, import `isAbortError` from `../hooks/useCoalescedMutation`.
2. In `setTheme`'s `catch` block, ignore `isAbortError(error)`; on real errors, restore `set({ theme: confirmedServerTheme })` when `confirmedServerTheme !== null` (when authenticated).

## Completion Criteria
- `npx tsc --noEmit` in `teamly-mobile/` exits `0`.
- Non-abort failure of `PATCH /auth/preferences/` restores `confirmedServerTheme` without affecting canceled/aborted requests.

## Comments
- 2026-11-25: Created from `develop` code review (`f85561c`).
