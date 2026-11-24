# 0007. Establish AI Analysis Pipeline and Subtask Adoption Seam

**Status**: accepted  
**Date**: 2026-11-24  

## Context

Per ADR-0001 and PROJECT_CONTEXT.md, AI summaries and suggested tasks must remain assistive rather than authoritative replacements for professor instructions. Previously, `apps.ai_assistant` was an unrouted shell holding `AiSummary` and `AiFeedback` models with no service logic, no structured task suggestion schema, no adoption mechanism into student `Subtask` records, and no adapter boundary for deterministic testing.

## Decision

We deepen `apps.ai_assistant` by introducing an AI analysis engine and an explicit adoption seam:

1. **Structured Schema:** Added `suggested_subtasks` (JSONField) to `AiSummary` to hold actionable task proposals independently of the student's authoritative `Subtask` checklist.
2. **Analysis Interface (`analyze_assignment`):** Deepened module interface taking an `Assignment` and returning a populated `AiSummary` containing concise summary text, extracted requirements, detected deadlines, and suggested subtasks.
3. **One-by-One Adoption Seam (`adopt_suggested_subtask`):** Created a seam converting an individual AI suggestion into an authoritative, student-owned `Subtask` record in `apps.assignments`, ensuring idempotency and preserving student agency.
4. **Two-Adapter Strategy:**
   - `DeterministicAiAdapter`: A rule-based heuristic extractor used for fast, offline TDD unit testing and local development without third-party API keys.
   - `GeminiAiAdapter`: Production LLM client calling Google Gemini when API keys are configured.
5. **Assignment Detail Integration:** Embedded the AI analysis card, requirement breakdown, and individual `[+ Adopt Subtask]` actions directly onto the Assignment Detail screen with an explicit assistance disclaimer.

## Consequences

- The interface is the test surface: the entire AI analysis and adoption workflow is tested deterministically in milliseconds without network calls or API costs.
- Student checklist data ownership is strictly maintained; AI outputs never overwrite existing checklist items.
- Students can seamlessly review, adopt, and manage suggested tasks right from the assignment detail view.
