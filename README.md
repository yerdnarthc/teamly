# Teamly — Your Timely Academic Assignment Assistant

Django web foundation for Teamly, an academic assignment manager that will
eventually pull assignments from Microsoft Teams (Graph API), summarize them
with AI, and present them in a React Native app. Right now this repo is only
the **Django web foundation**: auth + three screens.

## Demo flow

```text
Login → Register → Login → Home (+ Profile, Settings)
```

Register creates the account and redirects to **Login** (no auto-login, so the
full sequence is demoable). `Home`, `Profile`, and `Settings` require login —
anonymous visits redirect to `/login/?next=...`.

## Prerequisites

- Python 3.14
- The `.venv/` at the repo root (Django 6.1.1 installed there)

## Setup & run

```powershell
.\.venv\Scripts\Activate.ps1
cd teamly              # manage.py lives one level down — this step matters
pip install -r requirements.txt
Copy-Item .env.example .env   # then paste your Supabase DATABASE_URL into .env (optional for local dev)
python manage.py migrate
python manage.py runserver
```

Without `DATABASE_URL` in `.env`, Django falls back to local SQLite
(`db.sqlite3`). With it, Django uses Supabase PostgreSQL — see
“Supabase hookup” below.

| Check | Command (from `teamly/`) |
|---|---|
| Sanity check | `python manage.py check` |
| Tests | `python manage.py test` |
| Shell | `python manage.py shell` |

## Routes

| URL | View | Notes |
|---|---|---|
| `/` | redirect → `home:home` | |
| `/home/` | `apps.home.views.home_view` | `@login_required`, renders `HOME SCREEN` |
| `/register/` | `apps.register.views.register_view` | `UserCreationForm`, redirects to login |
| `/login/` | `apps.login.views.login_view` | `AuthenticationForm`, validates `next` URLs |
| `/login/logout/` | `apps.login.views.logout_view` | POST-only, then confirm page |
| `/profile/` | `apps.profile.views.profile_view` | `@login_required`, `Profile` form (full name, bio) |
| `/settings/` | `apps.user_settings.views.settings_view` | `@login_required`, `UserSettings` form (dark mode, email notifications) |
| `/admin/` | Django admin | `Profile` + `UserSettings` registered |

## Project structure (vertical slicing)

One Django app per business capability under `apps/`; each feature owns its
`templates/<feature>/` HTML and `static/{css,js,images}/<feature>/` assets.
Shared layout only: `templates/base.html` (tokens from `docs/DESIGN.md`).

```text
teamly/                  # repo root: .venv/, docs/, AGENTS.md, README.md
  teamly/                # Django project (run manage.py from here)
    manage.py
    requirements.txt     # Django + psycopg + dj-database-url + python-dotenv
    .env.example         # copy to .env, paste Supabase DATABASE_URL (git-ignored)
    teamly/              # settings.py, urls.py, wsgi.py (project config)
    apps/
      login/             # login + logout views/urls/tests
      register/          # registration view/urls/tests
      home/              # authenticated landing view/urls/tests
      profile/           # Profile model/form/view/urls/tests
      user_settings/     # UserSettings model/form/view/urls/tests
    templates/
      base.html          # shared layout (only shared template)
      login/ register/ home/ profile/ user_settings/
    static/
      css/<feature>/ js/<feature>/ images/<feature>/
    db.sqlite3           # local dev DB fallback (git-ignored)
  docs/
    PROJECT_CONTEXT.md   # full product spec & roadmap
    DESIGN.md            # palette, typography, component rules
```

## Supabase hookup (you do this in the Supabase dashboard)

Code is ready — Django reads `DATABASE_URL` from `teamly/.env` and uses
Supabase PostgreSQL when present. What remains is yours:

1. Create/open account at supabase.com → Dashboard → **New project**
   (name it, set a strong database password, wait for provisioning).
2. Project dashboard → **Connect** → copy the **Session Pooler**
   PostgreSQL connection string (use it verbatim — host/user/port vary by
   mode; Session Pooler suits IPv4-only classroom networks).
3. `Copy-Item .env.example .env`, paste the string as `DATABASE_URL=...`
   (URL-encode special chars in the password). Never commit `.env`.
4. From `teamly/`: `python manage.py check`, then
   `python manage.py migrate` (creates tables **in Supabase**),
   `python manage.py createsuperuser`, `python manage.py runserver`.
5. Verify: Supabase Dashboard → **Table Editor** → `auth_user`,
   `profile_profile`, `user_settings_usersettings` show your data.

Styling is a single token block in `templates/base.html` taken from `docs/DESIGN.md` — monochrome +
one blue accent, sharp corners, borders over shadows, light/dark via
`prefers-color-scheme`. No CSS framework.

## What's deliberately not here yet

Microsoft Graph / Teams sync, AI summarization, notifications, and React
Native are Stage 2 per `docs/PROJECT_CONTEXT.md`. The data model is kept
clean so those can be added without a rewrite.

## Dev notes

- `SECRET_KEY` is hardcoded with `DEBUG=True` — local dev only, move to `.env` before any deploy.
- Email uses the console backend (`EMAIL_BACKEND` in settings).
- See `AGENTS.md` for agent working conventions (nested layout, skills, gotchas).
