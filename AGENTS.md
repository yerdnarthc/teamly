# AGENTS.md — Teamly

## Repo layout (non-obvious)

- **Nested Django project.** Repo root is `C:\...\teamly\` (holds `.venv/`, `.git/`, `docs/`, `skills-lock.json`). The actual Django project is one level deeper: `teamly/manage.py`, `teamly/teamly/settings.py`, `teamly/db.sqlite3`. Running `python manage.py` from the repo root will fail — always `cd teamly` first.
- **Apps (vertical slicing):** `teamly/apps/{login,register,home,profile,user_settings}` — one app per business capability, each with its own `views.py`/`urls.py`/`models.py`/`tests.py`. Project package: `teamly/teamly/` (`settings.py`, `urls.py`, `wsgi.py`) acts as `config/`.
- **Project-level assets:** `teamly/templates/<feature>/` (HTML) + `teamly/static/{css,js,images}/<feature>/`. Only shared template is `templates/base.html`.
- **Manifests.** `teamly/requirements.txt` (`Django==6.1.3`, `psycopg[binary]`, `dj-database-url`, `python-dotenv`). No `pyproject.toml`/`Makefile`. `teamly/.env.example` documents `DATABASE_URL`; real `.env` is git-ignored and never committed.
- **DB:** Supabase-ready. `settings.py` uses `DATABASE_URL` (Supabase Session Pooler Postgres) when set, else falls back to SQLite at `teamly/db.sqlite3`. Git has no commits yet.

## Run & verify (exact)

```powershell
.\.venv\Scripts\Activate.ps1
cd teamly
pip install -r requirements.txt   # first time / after dep changes
python manage.py check        # fastest sanity check
python manage.py migrate
python manage.py runserver    # routes: /home/, /login/, /register/, /profile/, /settings/, /admin/
python manage.py test         # 10 tests: login/register/home/profile/user_settings slices
python manage.py shell
```

No lint/formatter/typecheck/CI/pre-commit configured.

## Architecture — what to build now vs later

- **Production Tech Stack Specification:** See `docs/TECH_STACK.md` and `docs/adr/0008-standardize-production-tech-stack.md` for the authoritative production tech stack (React Native Expo, NativeWind v4, TanStack Query, DRF SimpleJWT, Celery + Redis, Supabase Postgres, Google Gemini).
- **Current scope = Stage 1 (Django Web Foundation) & Stage 2 Transition (Headless DRF API & Expo Mobile).**
- **Coexisting Hybrid Model:** Deep domain service modules (`apps.assignments`, `apps.sync`, `apps.accounts`, `apps.ai_assistant`, `apps.notifications`) serve both Django template views and DRF REST endpoints (`/api/v1/`). Never place business logic directly in serializers or views.
- **Extensibility constraint:** Keep auth/data model clean. Distinguish external source data (Graph assignments) from Teamly-managed data (status, priority, notes, subtasks, AI summaries) — never overwrite student-managed fields on sync.
- **Async & Heavy Operations:** External sync (Microsoft Graph) and LLM summarization (Gemini) must run via Celery workers with Redis, keeping API response times snappy.
- **Prelim screens:** all five slices exist — `login`, `register`, `home`, `profile`, `accounts` (preferences). Shared layout is project-level `templates/base.html`.

## Gotchas

- **`teamly/teamly/settings.py` `EMAIL_BACKEND`** uses the console backend (dev-only); keep it so.
- **`teamly/teamly/urls.py`** includes one URLconf per slice (`apps.<feature>.urls`, each with `app_name`) — add new slices there, never wire views directly. Canonical names: `login:login`, `login:logout`, `register:register`, `home:home`, `profile:profile`, `user_settings:settings`.
- **`TEMPLATES DIRS=[BASE_DIR/'templates']`** — HTML lives project-level at `templates/<feature>/`, not app-scoped.
- `SECRET_KEY` hardcoded, `DEBUG=True`, `ALLOWED_HOSTS=[]` — dev-only; move secrets to `.env` before any deploy.

## Skills

Declared in `skills-lock.json` (root): `django-expert` (`vintasoftware/django-ai-plugins`), `django-patterns` (`affaan-m/ecc`) — installed under `.agents/skills/`. Use them for Django idioms.

## Agent skills

### Issue tracker

Local markdown files in `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical roles mapped 1:1 (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/` at the root). See `docs/agents/domain.md`.

## Instruction sources

- Global learning track: `C:\Users\Arth Andrey\.config\opencode\AGENTS.md` (explain why before implementing, flag advanced TS/testing, don't silently fix user mistakes, ask before large structural changes, confirm before destructive commands).
- Full product context & roadmap: `docs/PROJECT_CONTEXT.md` — trust this over assumptions.
