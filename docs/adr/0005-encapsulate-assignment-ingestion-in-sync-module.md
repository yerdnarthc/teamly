# 0005. Encapsulate Assignment Ingestion in Sync Module

**Status**: accepted  
**Date**: 2026-11-24  

## Context

Assignment data originating from Microsoft Teams via Microsoft Graph arrives as raw external payloads. Previously, `apps.sync` was a shallow shell (`SyncRun`, `SyncCursor`, `AssignmentEvent` models with no ingestion logic). Callers (web views, background workers, or future REST endpoints) would be forced to manually coordinate five models across `apps.sync`, `apps.academic`, and `apps.assignments`, creating seam leakage and risking accidental mutation of student-managed subtasks, personal notes, and status flags during synchronization.

## Decision

We deepen `apps.sync` by introducing an atomic assignment ingestion engine behind a single seam:

1. **Per-Subject Ingestion Scope:** Ingestion is scoped to an individual `Subject` (`ingest_subject_assignments`), aligning 1-to-1 with Microsoft Graph `/education/classes/{id}/assignments` and the physical `SyncCursor` model. Class sync failures are isolated.
2. **Strict Data Ownership Invariant:** External source fields (`title`, `instructions`, `due_at`, `teams_url`) are reconciled. Teamly-managed student fields (`status`, `priority`, `personal_notes`, `subtasks`, `tags`) are strictly preserved and never overwritten by external updates.
3. **Automated Reminder Rescheduling:** When an external deadline (`due_at`) shifts, ingestion automatically invokes `apps.notifications.services.schedule_deadline_reminder` to re-align the student's scheduled reminder with their notification preference.
4. **Safe Soft-Handling of Missing Records:** Assignments absent from incoming payloads are preserved (avoiding destruction of student checklists or notes), logging an `AssignmentEvent` for traceability.
5. **Cursor and Run Accounting:** Successful ingestion atomically updates `SyncCursor.last_ok_at` and records a completed `SyncRun` with a structured `SyncReport`.

## Consequences

- Callers interact with a single interface (`ingest_subject_assignments`), gaining high leverage.
- Sync rules, deduplication, and student data protection have complete locality in `apps.sync`.
- The interface is the test surface: in-memory mock Graph payloads can exercise the entire synchronization pipeline without external network or authentication dependencies.
