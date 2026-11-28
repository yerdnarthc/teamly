# Develop Branch Code Review (`main...HEAD` @ `f85561c`)

Baseline review of commits `1a8084e..f85561c` (`13` commits) against `AGENTS.md`, `GLOSSARY.md`, `docs/DESIGN.md`, `docs/TECH_STACK.md`, `docs/PROJECT_CONTEXT.md`, and `docs/adr/`.

## Actionable Tickets (Context Pointers)

Work tickets in priority order. Each ticket holds its own target files, positive fix spec, and checkable completion criterion.

- **01 — Protect `TEAMS` external source fields from overwrite** (`Status: ready-for-agent`, Spec/Data Ownership): [01-protect-teams-external-source-fields.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/01-protect-teams-external-source-fields.md)
- **02 — Extract domain services from DRF views & deduplicate helpers** (`Status: ready-for-agent`, Standards/Hybrid Model): [02-extract-service-layer-from-drf-views.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/02-extract-service-layer-from-drf-views.md)
- **03 — Add AI assistance disclaimer & deadline extraction** (`Status: ready-for-agent`, Spec/AI §4): [03-add-ai-disclaimer-and-deadline-extraction.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/03-add-ai-disclaimer-and-deadline-extraction.md)
- **04 — Add user-selectable assignment sorting** (`Status: ready-for-agent`, Spec/Assignments §5): [04-add-assignment-sorting.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/04-add-assignment-sorting.md)
- **05 — Roll back `useThemeStore` on non-abort API errors** (`Status: ready-for-agent`, Spec/ADR-0009): [05-fix-theme-rollback-on-error.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/05-fix-theme-rollback-on-error.md)
- **06 — Migrate lists to `FlashList`, forms to `react-hook-form` + `zod`, and share labels** (`Status: ready-for-agent`, Standards/TECH_STACK): [06-adopt-flashlist-and-rhf-zod-mobile.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/06-adopt-flashlist-and-rhf-zod-mobile.md)
- **07 — Align `GLOSSARY.md` terms and triage `DESIGN.md` sharp geometry** (`Status: needs-triage`, Standards/DESIGN & GLOSSARY): [07-align-glossary-terms-and-sharp-geometry.md](file:///c:/Users/Arth%20Andrey/Documents/teamly/.scratch/develop-code-review/issues/07-align-glossary-terms-and-sharp-geometry.md)

## Intentionally Deferred to Stage 2B (Not Ticketed Here)

- **Celery + Redis + DRF `UserRateThrottle` / `ScopedRateThrottle` + Notification Delivery Worker** (`docs/adr/0009`, `PROJECT_CONTEXT.md` §6)
- **Live Google Gemini LLM Invocation** (`GeminiAiAdapter` in `teamly/apps/ai_assistant/advisor.py`)
- **Microsoft Graph OAuth & Live Teams Ingestion** (`PROJECT_CONTEXT.md` §3)
