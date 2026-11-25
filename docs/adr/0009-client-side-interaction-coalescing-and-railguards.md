# ADR-0009: Client-Side Interaction Coalescing and Railguards

## Status
Accepted

## Context
During Stage 2 interactive QA of `teamly-mobile` against the Django DRF API (backed by remote Supabase Postgres), rapid UI interactions on toggles and multi-option selectors—such as **Notification Preference** switches (*Deadline Reminders*, *New Assignment Alerts*), lead-time pills (`6h / 12h / 24h / 48h`), **Theme Mode** selection (`SYSTEM / LIGHT / DARK`), and **AI Task Suggestion** feedback (`UP / DOWN`)—exhibited two problems:

1. **Perceived UI Latency:** Waiting for network round-trips before updating UI state made toggles feel sluggish.
2. **Backend Request Spam & Concurrency Races:** Rapidly toggling a switch fired overlapping `PATCH` / `POST` requests, wasting remote Postgres round-trips and triggering race conditions (e.g., `Reminder.MultipleObjectsReturned` prior to `notifications.0003_unique_unsent_reminder`).

Relying solely on backend HTTP `429` rate limiting to curb rapid tapping would degrade UX (snapping switches back and showing error alerts to legitimate users), while full Redis-backed DRF throttling belongs with the Celery + Redis production hardening phase.

## Decision
We implement **client-side interaction railguards** now as a two-tier strategy, and defer Redis-backed global DRF throttling to the Celery + Redis phase:

1. **Deep Coalescing Module (`teamly-mobile/src/hooks/useCoalescedMutation.ts`):**
   - **Instant Optimistic UI:** Applies cache updates synchronously on every tap.
   - **Trailing Debounce (350 ms) & Patch Merging:** Buffers rapid bursts into a single settled payload.
   - **No-Op Diff Guard:** Skips the network call if the settled state matches the last confirmed server snapshot (e.g., `On → Off → On` within 350 ms).
   - **`AbortController` Superseding:** Aborts obsolete in-flight requests via `AbortSignal` and ignores `ERR_CANCELED` / `CanceledError`.
   - **Safe Rollback:** Restores the last confirmed server snapshot on real failures.
   - Used by **Notification Preference** toggles/pills (`profile.tsx`) and **AI Task Suggestion** feedback (`assistant.tsx`), with a matching 300 ms debounced + `AbortController` pattern in `useThemeStore` (`themeStore.ts`).

2. **In-Flight Locks & Search Cancellation:**
   - One-shot/heavy/destructive actions (**Sync**, **Analyze**, **Save Profile**, **Delete Assignment**) enforce `disabled={isPending}` plus early-return guards.
   - Debounced assignment search (`index.tsx`) passes TanStack Query's `AbortSignal` to `apiClient.get`.

3. **Deferred Backend Rate Limiting:**
   - Centralized Redis-backed `UserRateThrottle` / `ScopedRateThrottle` will be enabled alongside Celery + Redis in the production hardening phase, complementing (rather than replacing) client-side coalescing.

## Consequences
- **Positive:** Rapid toggle/pill/theme/feedback bursts produce 0 or 1 settled API request while keeping 60fps UI responsiveness; concurrency logic is localized in `useCoalescedMutation.ts`.
- **Negative / Trade-off:** A toggle change waits up to 350 ms before persisting to Django (mitigated by flushing pending patches on component unmount).
