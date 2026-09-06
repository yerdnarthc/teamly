# AGENTS.md — Teamly

## Repo layout (non-obvious)

- **Nested Django project.** Repo root is `C:\...\teamly\` (holds `.venv/`, `.git/`, `docs/`, `skills-lock.json`). The actual Django project is one level deeper: `teamly/manage.py`, `teamly/teamly/settings.py`, `teamly/db.sqlite3`. Running `python manage.py` from the repo root will fail — always `cd teamly` first.
- **Apps:** `teamly/main` (home/base template) and `teamly/register` (auth). Project package: `teamly/teamly/` (`settings.py`, `urls.py`, `wsgi.py`).
- **No top-level manifests.** No `requirements.txt`/`pyproject.toml`/`Makefile`. Deps are `Django==6.1.1`, `asgiref`, `sqlparse`, `tzdata` (see `pip freeze`; `.venv` at repo root). No `README.md` at either level; full spec is `docs/PROJECT_CONTEXT.md`.
- **DB:** SQLite at `teamly/db.sqlite3` (`BASE_DIR = teamly/teamly/..`). Git has no commits yet.

## Run & verify (exact)

```powershell
.\.venv\Scripts\Activate.ps1
cd teamly
python manage.py check        # fastest sanity check
python manage.py migrate
python manage.py runserver    # routes: /home, /register/, /admin/
python manage.py test         # exists but tests.py are empty stubs
python manage.py shell
```

No lint/formatter/typecheck/CI/pre-commit configured.

## Architecture — what to build now vs later

- **Current scope = Prelim: Django web foundation only.** Per `docs/PROJECT_CONTEXT.md`, the required slice is exactly `Login → Register → Login → Home` (three screens + routing/views/templates/auth). Prioritize correct Django structure, not the full assignment pipeline.
- **Do NOT prematurely implement** Microsoft Graph / Teams sync, AI summarization, notifications, or React Native. Those are Stage 2 (`React Native → Django REST API → DB → Graph → AI`). Current stage is Stage 1: `Browser → Django URLs → Views → Templates → DB`.
- **Extensibility constraint:** Keep auth/data model clean so later stages can add Graph/AI without rewrite. Distinguish external source data (Graph assignments) from Teamly-managed data (status, priority, notes, AI summaries) — don't overwrite user-managed fields on sync.
- **Prelim screens:** `Login` is still missing; `Register` (`register/views.py:7`) + `Home` (`main/views.py:5` returning `HttpResponse`) are scaffolded. `main/templates/main/base.html` is the shared layout (`{% block title %}`/`{% block content %}`) — child templates rely on `settings.py:60` `APP_DIRS=True`.

## Gotchas

- **`teamly/teamly/settings.py:125` `MAILERS`** is a typo (ignored by Django); correct key is `EMAIL_BACKEND` if email is needed.
- **`teamly/teamly/urls.py:22`** wires `home/` and `register/` directly — no `include("main.urls")` pattern. Add new routes there.
- **`TEMPLATES DIRS=[]`** — templates are app-scoped (`main/templates/main/`, `register/templates/register/`), not project-level.
- `SECRET_KEY` hardcoded, `DEBUG=True`, `ALLOWED_HOSTS=[]` — dev-only; move secrets to `.env` before any deploy.

## Skills

Declared in `skills-lock.json` (root): `django-expert` (`vintasoftware/django-ai-plugins`), `django-patterns` (`affaan-m/ecc`) — installed under `.agents/skills/`. Use them for Django idioms.

## Instruction sources

- Global learning track: `C:\Users\Arth Andrey\.config\opencode\AGENTS.md` (explain why before implementing, flag advanced TS/testing, don't silently fix user mistakes, ask before large structural changes, confirm before destructive commands).
- Full product context & roadmap: `docs/PROJECT_CONTEXT.md` — trust this over assumptions.
