# 0003. Consolidate Authentication and Account Slices into Deep Identity Module

**Status**: accepted  
**Date**: 2026-11-23  

## Context

Previously, user authentication was split across three separate, shallow slices: `apps.login` (a 36-line pass-through view), `apps.register` (a 22-line pass-through view), and `apps.accounts` (an unrouted shell holding `MicrosoftAccount` with empty views and no tests). Understanding or extending user credentials required navigating between three separate packages and URL configurations, diluting code locality and increasing cognitive friction.

## Decision

We consolidated user identity, session management, registration, and external Microsoft account linking into the deep module `apps.accounts`:

1. **Unified Identity Views:** Implemented `login_view`, `logout_view`, and `register_view` directly in `apps.accounts.views`, alongside `accounts_view` for connected account management.
2. **Canonical Namespace with Backward-Compatible Aliases:** Configured `apps.accounts.urls` under namespace `accounts`, while maintaining clean alias delegations in `apps.login.views` and `apps.register.views`.
3. **Comprehensive Test Suite:** Added unit tests covering login GET/POST flows, authenticated redirects, logout termination, registration account creation, and Microsoft account model relationships.

## Consequences

- The `apps.accounts` module is now a deep module encapsulating user credential and account management.
- Eliminates shallow, duplicated authentication logic while preserving 100% backward compatibility for existing templates, URLconfs, and Prelim navigation routes (`/login/`, `/register/`).
- Future OAuth Microsoft Graph integrations can live directly inside `apps.accounts` without introducing additional fragment apps.
