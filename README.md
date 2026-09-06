# Teamly — Your Timely Academic Assignment Assistant

Django web foundation for Teamly, an academic assignment manager that will
eventually pull assignments from Microsoft Teams (Graph API), summarize them
with AI, and present them in a React Native app. Right now this repo is only
the **Django web foundation**: auth + three screens.

## Demo flow

```text
Login → Register → Login → Home
```

Register creates the account and redirects to **Login** (no auto-login, so the
full sequence is demoable). `Home` requires login — anonymous visits redirect
to `/login/?next=/home/`.

## Prerequisites

- Python 3.14
- The `.venv/` at the repo root (Django 6.1.1 installed there)

## Setup & run

```powershell
.\.venv\Scripts\Activate.ps1
cd teamly              # manage.py lives one level down — this step matters
python manage.py migrate
python manage.py runserver
```

| Check | Command (from `teamly/`) |
|---|---|
| Sanity check | `python manage.py check` |
| Tests | `python manage.py test` |
| Shell | `python manage.py shell` |

## Routes

| URL | View | Notes |
|---|---|---|
| `/` | redirect → `home` | |
| `/home/` | `main.views.home` | `@login_required`, renders `HOME SCREEN` |
| `/register/` | `register.views.register` | `UserCreationForm`, redirects to login |
| `/login/` | `register.views.login_view` | `AuthenticationForm`, validates `next` URLs |
| `/logout/` | `register.views.logout_view` | POST-only, then confirm page |
| `/admin/` | Django admin | |

## Project structure

```text
teamly/                  # repo root: .venv/, docs/, AGENTS.md, README.md
  teamly/                # Django project (run manage.py from here)
    manage.py
    teamly/              # settings.py, urls.py, wsgi.py
    main/                # home view + shared base.html layout
    register/            # register/login/logout views + templates + tests
    db.sqlite3           # local dev DB (git-ignored)
  docs/
    PROJECT_CONTEXT.md   # full product spec & roadmap
    DESIGN.md            # palette, typography, component rules
```

Templates use `APP_DIRS` lookup (`main/templates/main/`,
`register/templates/register/`). Styling is a single token block in
`main/templates/main/base.html` taken from `docs/DESIGN.md` — monochrome +
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
