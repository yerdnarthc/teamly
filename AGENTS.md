# AGENTS.md — Teamly

## Repo layout (non-obvious)

- **Nested Django project.** Repo root is `C:\...\teamly\` (holds `.venv/`, `.git/`, `docs/`, `skills-lock.json`). The actual Django project is one level deeper: `teamly/manage.py`, `teamly/teamly/settings.py`, `teamly/db.sqlite3`. Running `python manage.py` from the repo root will fail — always `cd teamly` first.
- **Apps (vertical slicing):** `teamly/apps/{login,register,home,profile,user_settings}` — one app per business capability, each with its own `views.py`/`urls.py`/`models.py`/`tests.py`. Project package: `teamly/teamly/` (`settings.py`, `urls.py`, `wsgi.py`) acts as `config/`.
- **Project-level assets:** `teamly/templates/<feature>/` (HTML) + `teamly/static/{css,js,images}/<feature>/`. Only shared template is `templates/base.html`.
- **Manifests.** `teamly/requirements.txt` (`Django==4.2.30`, `psycopg[binary]`, `dj-database-url`, `python-dotenv`). No `pyproject.toml`/`Makefile`. `teamly/.env.example` documents `DATABASE_URL`; real `.env` is git-ignored and never committed.
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

- **Current scope = Prelim: Django web foundation only.** Per `docs/PROJECT_CONTEXT.md`, the required slice is exactly `Login → Register → Login → Home` (three screens + routing/views/templates/auth). Prioritize correct Django structure, not the full assignment pipeline.
- **Do NOT prematurely implement** Microsoft Graph / Teams sync, AI summarization, notifications, or React Native. Those are Stage 2 (`React Native → Django REST API → DB → Graph → AI`). Current stage is Stage 1: `Browser → Django URLs → Views → Templates → DB`.
- **Extensibility constraint:** Keep auth/data model clean so later stages can add Graph/AI without rewrite. Distinguish external source data (Graph assignments) from Teamly-managed data (status, priority, notes, AI summaries) — don't overwrite user-managed fields on sync.
- **Prelim screens:** all five slices exist — `login` (`apps/login/views.py`: `login_view` + POST-only `logout_view`), `register` (`apps/register/views.py`: `UserCreationForm` → redirect login), `home` (`apps/home/views.py`: `@login_required`), `profile` (`Profile` model + form/view), `user_settings` (`UserSettings` model + form/view). Shared layout is project-level `templates/base.html` (`{% block title %}`/`content`/`extra_css`/`extra_js`); `settings.py` sets `DIRS=[BASE_DIR/'templates']` + `STATICFILES_DIRS=[BASE_DIR/'static']`.

## Gotchas

- **`teamly/teamly/settings.py` `EMAIL_BACKEND`** uses the console backend (dev-only); keep it so.
- **`teamly/teamly/urls.py`** includes one URLconf per slice (`apps.<feature>.urls`, each with `app_name`) — add new slices there, never wire views directly. Canonical names: `login:login`, `login:logout`, `register:register`, `home:home`, `profile:profile`, `user_settings:settings`.
- **`TEMPLATES DIRS=[BASE_DIR/'templates']`** — HTML lives project-level at `templates/<feature>/`, not app-scoped.
- `SECRET_KEY` hardcoded, `DEBUG=True`, `ALLOWED_HOSTS=[]` — dev-only; move secrets to `.env` before any deploy.

## Skills

Declared in `skills-lock.json` (root): `django-expert` (`vintasoftware/django-ai-plugins`), `django-patterns` (`affaan-m/ecc`) — installed under `.agents/skills/`. Use them for Django idioms.

## Instruction sources

- Global learning track: `C:\Users\Arth Andrey\.config\opencode\AGENTS.md` (explain why before implementing, flag advanced TS/testing, don't silently fix user mistakes, ask before large structural changes, confirm before destructive commands).
- Full product context & roadmap: `docs/PROJECT_CONTEXT.md` — trust this over assumptions.
