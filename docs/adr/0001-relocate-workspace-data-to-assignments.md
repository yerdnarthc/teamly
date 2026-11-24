# 0001. Relocate Student Workspace Data to Assignments Module

**Status**: accepted  
**Date**: 2026-11-23  

## Context

Previously, `PersonalNote`, `Attachment`, and `Subtask` models were placed in `apps.ai_assistant`. This violated domain ownership: personal notes, syllabus attachments, and task checklists are authoritative student and assignment data, not disposable AI outputs. Placing them in `ai_assistant` created seam leakage, where disabling or refactoring AI capabilities would break or delete core assignment workspace data (failing the deletion test).

## Decision

We moved `PersonalNote`, `Attachment`, and `Subtask` from `apps.ai_assistant.models` into `apps.assignments.models`. 

1. **Table Preservation:** Models retain their explicit database table names (`personal_note`, `attachment`, `subtask`), ensuring schema stability across environments without table renames.
2. **Student Ownership of Subtasks:** Subtasks are strictly Teamly-managed student data. AI task suggestions will live in `AiSummary` and must be explicitly accepted by the student to become `Subtask` records, preventing AI re-runs from overwriting student checklist progress.
3. **Attachment Discrimination:** Attachments retain `added_by` (`TEAMS` vs `USER`). Teams attachments are read-only external source data, while user attachments are manageable by the student and untouched by sync operations.
4. **Multi-entry Notes:** Personal notes remain a 1-to-many relationship with timestamps to support chronological progress tracking.

## Consequences

- The `apps.assignments` module becomes a deep module encapsulating the complete student assignment workspace.
- The `apps.ai_assistant` module shrinks to its proper assistive role, owning only `AiSummary` and `AiFeedback`.
- Deleting or disabling `ai_assistant` preserves all student notes, checklists, and attachments.
- Callers and tests interact with workspace entities directly through the `assignments` module interface.
