# 0006. Consolidate Account Settings and 3-Way Theme Mode into Accounts Module

**Status**: accepted  
**Date**: 2026-11-24  

## Context

Previously, user preferences were isolated inside `apps.user_settings`, which was a shallow pass-through slice holding only two fields: an orphaned `dark_mode` boolean (ignored by CSS) and `email_notifications` (superseded by `apps.notifications`). Meanwhile, `apps.accounts` owned credentials, login/logout sessions, and connected Microsoft Teams account records. User identity and preferences were fragmented across three separate slices (`accounts`, `user_settings`, `profile`), failing the deletion test.

## Decision

We deepen `apps.accounts` to absorb account settings and visual presentation preferences, retiring the hollow `user_settings` slice:

1. **AccountPreference Model:** Introduced `AccountPreference` in `apps.accounts.models` with an explicit 3-way `ThemeMode` (`SYSTEM`, `LIGHT`, `DARK`), attached to `AUTH_USER_MODEL`.
2. **Unified Account Settings Interface:** Established a consolidated Account Settings screen (`apps.accounts.views.settings_view`) bringing together user credentials, 3-way theme selection, connected Microsoft 365 profile status, and direct shortcuts to Notification Preferences and Profile.
3. **Template & CSS Theme Engine:** Added a context processor (`theme_context`) injecting `user_theme` into `base.html`, configuring a `data-theme` attribute on `<html>` that respects the 3-way mode while retaining system CSS media queries when set to `SYSTEM`.
4. **Backward-Compatible Routing:** Retained `/settings/` URL routing delegating directly to `apps.accounts.views.settings_view` and maintained namespace alias `user_settings:settings` to preserve 100% backward compatibility for existing templates and tests.

## Consequences

- The shallow `apps.user_settings` slice is decommissioned, passing the deletion test by concentrating identity and preferences into `apps.accounts`.
- Students can explicitly choose between matching their operating system or overriding with Light or Dark mode.
- Connected Microsoft account information, credentials, and visual preferences are managed through a single cohesive seam.
