# ADR-0008: Standardize Production Tech Stack (Expo, DRF, Celery, Supabase, Gemini)

## Status
Accepted

## Context
Teamly is transitioning from Stage 1 (Django Web Foundation & SSR) to Stage 2 (Production Mobile Client & Headless Services). As detailed in `docs/PROJECT_CONTEXT.md`, the ultimate product goal is an AI-powered academic assignment assistant connecting Microsoft Teams Education with mobile-first student task management.

Without an explicit, authoritative production tech stack documented in the codebase, future development and multi-agent sessions risk architectural fragmentation:
- Conflicting frontend libraries (e.g., bare React Native vs Expo, Tamagui vs NativeWind, Redux vs TanStack Query).
- Inconsistent API communication and authentication strategies (e.g., cookie sessions vs basic auth vs JWT).
- Web-thread blocking during external Microsoft Graph polling and AI generation.
- Database connection exhaustion against Supabase pool limits.

A comprehensive architectural grilling session was conducted to resolve and align all technical layers.

## Decision

We standardize on the following production technology stack:

1. **Mobile Client (Frontend)**:
   - **Framework**: React Native with **Expo (Managed Workflow / Continuous Native Generation - Prebuild)** and **TypeScript**.
   - **Navigation**: **Expo Router** (file-based navigation, nested tabs, stacks, and modal routes).
   - **Styling**: **NativeWind v4** (Tailwind CSS) with design tokens synchronizing with the backend's 3-way Theme Mode (`SYSTEM`, `LIGHT`, `DARK`).
   - **State & Data Fetching**: **TanStack Query v5** (server state, caching, optimistic updates, background refetching) + **Zustand** (lightweight local client state).
   - **Performance & UX Components**: `@shopify/flash-list` (virtualized 60/120 FPS lists), `react-native-reanimated` and `react-native-gesture-handler` (gestures and micro-interactions), `@gorhom/bottom-sheet`, `react-hook-form` + `zod` (validation), `lucide-react-native`, `expo-secure-store`, `expo-notifications`, and `expo-haptics`.
   - **Build & Distribution**: **Expo Application Services (EAS Build + EAS Update)** for Android/iOS releases and over-the-air updates.

2. **Backend Services & API**:
   - **Framework**: **Django 6** with **Django REST Framework (DRF)**.
   - **Dual Surface Model (Coexisting Hybrid)**: Deep domain service modules (`apps.assignments`, `apps.sync`, `apps.accounts`, `apps.ai_assistant`, `apps.notifications`) serve both existing Django HTML views (showcase/admin/desktop portal) and DRF REST endpoints under `/api/v1/`.
   - **API Design**: Deep Service-Oriented endpoints. Serializers handle input validation and JSON presentation; business operations, subtask adoption, and sync ingestion delegate to underlying domain services.
   - **Mobile Authentication**: **`djangorestframework-simplejwt`** using short-lived Access Tokens and rotating Refresh Tokens stored encrypted in `expo-secure-store`. Token blacklisting is enforced in PostgreSQL on logout.

3. **Asynchronous Processing & External Integrations**:
   - **Task Queue & Scheduler**: **Celery + Redis** (worker dyno for background Microsoft Graph assignment ingestion and LLM summarization; `celery-beat` for periodic assignment checks and deadline alert dispatching).
   - **Microsoft Graph Integration**: OAuth2 Authorization Code flow with PKCE handled via Django backend redirect. OAuth refresh tokens are encrypted at rest in PostgreSQL using symmetric Fernet encryption (`ENCRYPTION_SECRET_KEY`).
   - **AI Processing Pipeline**: Official **Google GenAI SDK (`google-genai`)** targeting **Gemini Flash** models with strict JSON Schema output. Results are cached deterministically in `AiSummary` to prevent duplicate API costs.

4. **Database & Infrastructure**:
   - **Database**: **Supabase PostgreSQL** via Session/Transaction pooler (`DATABASE_URL`), with SQLite retained for local offline development and fast unit testing (`--keepdb`).
   - **Migrations**: Automated pre-deploy release command hook (`python manage.py migrate --noinput`) executed on an isolated runner before web container boot.
   - **Hosting Target**: Modern PaaS platform (e.g. Railway / Render / Fly.io) with dedicated web dynos (Gunicorn), worker dynos (Celery), and managed Redis.

## Consequences

### Positive
- **Clear Architectural Seams**: Frontend engineers and AI agents have an unambiguous specification; no ad-hoc library choices.
- **High Performance & Responsiveness**: Heavy Graph sync and AI workloads are offloaded to Celery background workers, ensuring mobile API responses stay under 150ms.
- **Enterprise-Grade Security**: Sensitive student Microsoft OAuth tokens and API secrets are encrypted at rest; JWTs use secure mobile hardware storage (`expo-secure-store`).
- **Smooth Developer Workflow**: Expo CNG avoids maintaining brittle native iOS/Android directories in version control, while EAS handles automated cloud builds.

### Negative / Trade-offs
- **Additional Infrastructure Component**: Requires running and maintaining a Redis instance and Celery worker process in production alongside the Django web dyno.
- **Token Rotation Overhead**: Mobile HTTP client must maintain an interceptor to handle transparent 401 token refresh cycles.
