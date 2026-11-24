# Teamly Production Tech Stack Specification

This document provides the authoritative blueprint for Teamly's production architecture, covering the frontend mobile client, backend REST services, external integration pipelines, data persistence, and cloud infrastructure.

All engineers and AI agents must adhere strictly to these technologies, design patterns, and constraints.

---

## 1. Architectural Overview & System Topology

Teamly operates as a **Coexisting Hybrid Architecture**:
- **Mobile Client**: Production student interface built with React Native and Expo.
- **Backend API**: Headless REST services under `/api/v1/` built with Django REST Framework (DRF).
- **Web Portal / Showcase**: Existing Django template views (`/home/`, `/assignments/`, `/accounts/preferences/`, `/admin/`) serving as a desktop/showcase interface sharing the exact same backend service modules.
- **Asynchronous Workers**: Distributed Celery workers with a Redis broker handling Microsoft Graph delta sync, periodic background checks, deadline reminders, and Gemini AI extraction.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDENT CLIENT SURFACES                         │
│                                                                        │
│   ┌─────────────────────────────────┐   ┌──────────────────────────┐   │
│   │   React Native Expo Mobile App  │   │  Django SSR Web (Hybrid) │   │
│   │   (Expo Router, NativeWind v4,  │   │  (Templates, Base Layout,│   │
│   │   TanStack Query, Zustand)      │   │  Admin, SQL Showcase)    │   │
│   └────────────────┬────────────────┘   └────────────┬─────────────┘   │
└────────────────────┼─────────────────────────────────┼─────────────────┘
                     │ HTTPS / REST                    │ Internal
                     │ (SimpleJWT Bearer)              │ Session Auth
                     ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DJANGO CORE BACKEND                             │
│                                                                        │
│   ┌─────────────────────────────────┐   ┌──────────────────────────┐   │
│   │     DRF ViewSets & APIViews     │   │    Django Web Views      │   │
│   │       (/api/v1/ endpoints)      │   │  (/assignments/, /home/) │   │
│   └────────────────┬────────────────┘   └────────────┬─────────────┘   │
│                    │                                 │                 │
│                    └────────────────┬────────────────┘                 │
│                                     ▼                                  │
│                     ┌───────────────────────────────┐                  │
│                     │   DEEP DOMAIN SERVICE LAYER   │                  │
│                     │  (apps.assignments, sync,    │                  │
│                     │   accounts, ai_assistant,     │                  │
│                     │   notifications)              │                  │
│                     └───────┬──────────────┬────────┘                  │
└─────────────────────────────┼──────────────┼───────────────────────────┘
                              │              │ Celery Task Dispatch
                              ▼              ▼
┌────────────────────────────────┐  ┌────────────────────────────────────┐
│      PERSISTENT STORAGE        │  │       ASYNC WORKER CLUSTER         │
│                                │  │                                    │
│   Supabase PostgreSQL          │  │   Redis Broker & Result Backend    │
│   (Session / Transaction Pool) │  │                 │                  │
│   - Application Tables         │  │                 ▼                  │
│   - Encrypted OAuth Tokens     │  │   Celery Workers & Celery Beat     │
│   - JWT Token Blacklist        │  │   - Microsoft Graph Sync Worker    │
│                                │  │   - Gemini AI Extraction Pipeline  │
│                                │  │   - Scheduled Deadline Reminders   │
└────────────────────────────────┘  └─────────────────┬──────────────────┘
                                                      │
                                                      ▼
                                    ┌────────────────────────────────────┐
                                    │       EXTERNAL CLOUD SERVICES      │
                                    │                                    │
                                    │   - Microsoft Graph API (OAuth2)   │
                                    │   - Google Gemini API (GenAI SDK)  │
                                    │   - Expo Push Notification Service │
                                    └────────────────────────────────────┘
```

---

## 2. Frontend: React Native & Expo Mobile Client

### 2.1 Core Framework & Tooling
- **Runtime & Tooling**: **Expo** (Managed Workflow with Continuous Native Generation / `expo prebuild`) using **TypeScript** (`strict: true`).
- **Routing & Navigation**: **Expo Router v3+** (File-based routing under `app/` directory).
  - Tabs: `(tabs)/index.tsx` (Dashboard), `(tabs)/assignments.tsx` (Feed), `(tabs)/calendar.tsx`, `(tabs)/profile.tsx`.
  - Stacks & Modals: `assignment/[id].tsx`, `modal/filter.tsx`, `modal/add-assignment.tsx`.
- **Build & Release**: **Expo Application Services (EAS)**:
  - `EAS Build`: Cloud compilation for Android (`.aab` / `.apk`) and iOS (`.ipa`).
  - `EAS Update`: Live Over-The-Air (OTA) updates for rapid bug fixes without store review.

### 2.2 Styling, Theme & Design Tokens
- **Styling Engine**: **NativeWind v4** (Tailwind CSS for React Native).
- **Design Tokens**: Standardized colors (`primary`, `secondary`, `surface`, `accent`, `destructive`, `border`, `muted`) configured in `tailwind.config.js`.
- **Theme Synchronization**: Full integration with the user's backend `AccountPreference.theme_mode` (`SYSTEM`, `LIGHT`, `DARK`) via dynamic color scheme listeners and CSS custom properties.

### 2.3 State Management & Network Strategy
- **Server State**: **TanStack Query v5 (`@tanstack/react-query`)**:
  - Handles caching, automatic background revalidation, query deduplication, and retry logic.
  - Optimistic mutations for high-frequency actions: toggling subtask completion, updating assignment status, adopting suggested AI subtasks.
- **Client / UI State**: **Zustand**:
  - Lightweight, un-opinionated store for ephemeral UI state (active filter drawer, search queries, offline sync queues).
- **HTTP Client**: Typed Axios instance with request/response interceptors:
  - Automatically attaches `Authorization: Bearer <access_token>` from `expo-secure-store`.
  - Transparently catches `401 Unauthorized`, calls `/api/v1/auth/token/refresh/`, updates the stored token, and retries the original request.

### 2.4 Performance & Mobile UX Libraries
- **Virtualized Lists**: **`@shopify/flash-list`** (Mandatory for assignment lists, activity feeds, and notification logs; strictly avoid standard `FlatList` for feeds).
- **Gestures & Animation**: **`react-native-reanimated`** + **`react-native-gesture-handler`** (Used for swipe-to-complete, pull-to-sync, and fluid progress indicators).
- **Bottom Sheets & Drawers**: **`@gorhom/bottom-sheet`** (For assignment details, subtask addition, and filter sheets).
- **Form Management**: **`react-hook-form`** with **`zod`** schema validation resolvers.
- **Icons**: **`lucide-react-native`** (consistent icon family matching modern design standards) with `@expo/vector-icons` as backup.
- **Device Hardware & System APIs**:
  - `expo-secure-store`: Encrypted keystore/keychain storage for auth tokens.
  - `expo-notifications`: Local and remote push notification scheduling.
  - `expo-haptics`: Tactile feedback on milestone completions (e.g., checking off final subtask).

---

## 3. Backend: Django 6 REST Services & Core Architecture

### 3.1 Django Core & DRF Configuration
- **Framework**: **Django 6.1+** with Python 3.12+.
- **API Extension**: **Django REST Framework (DRF)**.
- **API Base URL**: All mobile API endpoints are strictly versioned under `/api/v1/`.

### 3.2 Dual Surface (Coexisting Hybrid) Pattern
- **Principle**: Django Views (SSR) and DRF ViewSets are thin presentation adapters over deep domain services.
- **Domain Modules**:
  - `apps.assignments`: Assignment querying, custom QuerySets, lifecycle status transitions, subtask checklists.
  - `apps.sync`: External Teams assignment ingestion (`ingest_subject_assignments`), `SyncReport`, delta reconciliation.
  - `apps.accounts`: Authentication, student profile management, 3-way theme preferences (`AccountPreference`).
  - `apps.ai_assistant`: AI adapter seam (`BaseAiAdapter`, `GeminiAiAdapter`), subtask extraction and adoption.
  - `apps.notifications`: Notification policy rules, schedule reminders (`schedule_deadline_reminder`).
- **Rule**: Never duplicate business logic inside DRF serializers or Django views. Always delegate to the domain service module.

### 3.3 Authentication & Authorization
- **Mobile Auth**: **`djangorestframework-simplejwt`**:
  - `POST /api/v1/auth/token/`: Exchange credentials for access + refresh token.
  - `POST /api/v1/auth/token/refresh/`: Rotate refresh token and issue new access token.
  - `POST /api/v1/auth/token/blacklist/`: Invalidate refresh token upon logout.
- **Token Lifespans**:
  - Access Token: 15–30 minutes (short-lived).
  - Refresh Token: 30 days (with rolling refresh on each use).
- **Web Auth**: Standard secure session cookies with CSRF protection (`django.contrib.auth`).

---

## 4. Asynchronous Processing & Task Queue

### 4.1 Celery & Redis Architecture
- **Task Broker**: **Redis** (Standalone managed instance).
- **Task Worker**: **Celery Worker** running in a dedicated process/dyno.
- **Scheduler**: **Celery Beat** executing recurring background jobs:
  - Daily assignment synchronization polling.
  - Hourly deadline proximity evaluation (dispatching push notifications for assignments due in 24h / 3h).

### 4.2 Key Background Tasks
1. `apps.sync.tasks.sync_student_teams_assignments(user_id)`:
   - Fetches new/updated assignments from Microsoft Graph.
   - Executes `ingest_subject_assignments()`.
   - Triggers automated AI extraction for newly detected assignments.
2. `apps.ai_assistant.tasks.generate_assignment_ai_summary(assignment_id)`:
   - Offloads Gemini LLM extraction so user HTTP requests never wait for external AI latency.
3. `apps.notifications.tasks.dispatch_due_notifications()`:
   - Evaluates active assignments against student reminder preferences and schedules push/local alerts.

---

## 5. Integrations: Microsoft Graph & Google Gemini

### 5.1 Microsoft Graph Integration
- **Protocol**: OAuth2 Authorization Code Grant with PKCE.
- **Endpoints**: Microsoft Identity Platform (`https://login.microsoftonline.com/common/oauth2/v2.0`).
- **Scopes**: `offline_access`, `User.Read`, `EducationAssignment.Read`, `EducationAssignment.ReadBasic`.
- **Token Security**:
  - Microsoft OAuth tokens are **encrypted at rest** in PostgreSQL using symmetric cryptography (`cryptography.fernet.Fernet`) with an encryption key loaded from `ENCRYPTION_SECRET_KEY`.
  - Never log or expose raw OAuth tokens in error traces or responses.
- **Data Integrity Rule**:
  - Microsoft Graph assignments are external source data. Sync processes update titles, due dates, and original instructions, but **must never overwrite student-managed state** (subtasks, personal notes, custom priorities, status).

### 5.2 AI Assistant: Google Gemini
- **SDK**: Official **Google GenAI SDK (`google-genai`)**.
- **Model**: **Gemini 2.5 Flash** (or `gemini-2.0-flash` / `gemini-1.5-flash` for high-throughput, low-latency structured output).
- **Output Schema**: Enforced JSON Schema matching:
  - `summary`: Concise markdown overview.
  - `key_requirements`: List of actionable deliverables.
  - `suggested_subtasks`: Structured list of `[{"title": str, "description": str}]`.
- **Idempotency & Cost Control**:
  - AI extraction results are cached in `AiSummary` linked to the assignment.
  - If assignment instructions have not changed, subsequent requests read from the database without invoking the Gemini API.

---

## 6. Database, Infrastructure & DevOps

### 6.1 Database (PostgreSQL & Supabase)
- **Engine**: **PostgreSQL 15+** hosted on **Supabase**.
- **Connection Configuration**: Configured via `DATABASE_URL` with `dj-database-url` and `psycopg[binary]`.
- **Connection Pooling**: Connected via Supabase Session / Transaction Pooler (Supavisor / PgBouncer) to prevent connection exhaustion from concurrent Celery workers and Gunicorn dynos.
- **Local Dev / Testing**: SQLite at `teamly/db.sqlite3` retained for local offline development. Unit tests use `--keepdb` on Supabase or SQLite.

### 6.2 Database Migration Policy
- **Automated Pre-Deploy Hook**: Migrations must run during the platform's **Release Command / Pre-deploy Hook** (`python manage.py migrate --noinput`).
- **Constraint**: Never run migrations inside the main web server process startup command (`gunicorn`) to avoid concurrency deadlocks across multiple web instances.

### 6.3 Hosting & Production Infrastructure
- **PaaS Platform**: **Railway / Render / Fly.io** with three core components:
  1. **Web Dyno**: Running `gunicorn teamly.wsgi:application --workers 3 --bind 0.0.0.0:$PORT`.
  2. **Worker Dyno**: Running `celery -A teamly worker -l info --concurrency 2`.
  3. **Scheduler Dyno**: Running `celery -A teamly beat -l info`.
  4. **Redis Service**: Managed Redis instance for the Celery message broker and result backend.
- **Environment Management**: Strict separation of configuration via `.env` / platform secrets (e.g., `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `ENCRYPTION_SECRET_KEY`).
