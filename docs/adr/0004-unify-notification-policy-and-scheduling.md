# 0004. Unify Notification Policy with Scheduling and Delivery

**Status**: accepted  
**Date**: 2026-11-23  

## Context

Previously, `NotificationPreference` was defined inside `apps.user_settings.models`, but was never used by the user settings views or forms. Meanwhile, reminder scheduling (`Reminder`) and dispatch logs (`NotificationLog`) resided inside `apps.notifications`. This split severed the seam between notification policy and the delivery engine: checking whether a student had deadline alerts enabled or querying their preferred lead hours required crossing app boundaries, leaving the preference model effectively orphaned.

## Decision

We moved `NotificationPreference` into `apps.notifications.models` and established a cohesive notification engine:

1. **Table Preservation:** Retained the physical table name `notification_preference`, using non-destructive `SeparateDatabaseAndState` migrations so no database tables were dropped.
2. **Policy-Driven Reminder Scheduling:** Implemented `schedule_deadline_reminder` in `apps.notifications.services` that inspects the student's `NotificationPreference` (evaluating `deadline_enabled` and `lead_hours`) before creating or deleting pending `Reminder` records.
3. **Preference Form & View:** Updated `notifications_view` and `NotificationPreferenceForm` allowing students to configure lead time and alert toggles directly from the Notification Center.
4. **Navigation Integration:** Added the Notifications link to the primary navigation bar in `templates/base.html`.

## Consequences

- The `apps.notifications` module is now a deep module encapsulating preferences, reminder scheduling, and delivery history.
- `apps.user_settings` is cleaned of orphaned notification schema, focusing purely on theme and account UI settings.
- Both policy enforcement and reminder generation are verified through a single test surface in `apps.notifications.tests`.
