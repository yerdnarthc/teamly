# Teamly : Your Timely Academic Assignment Assistant

Teamly is an AI-powered academic assignment management application that automatically retrieves and organizes students' assignments from Microsoft Teams. It uses AI-assisted processing to summarize assignment instructions, identify important requirements and deadlines, and help students better understand their academic tasks. The application provides a centralized dashboard where students can monitor newly detected, upcoming, completed, and overdue assignments. It also provides customizable notifications to help students stay informed and complete their academic requirements on time.

## Problem Statement

Students often receive assignments and academic requirements through multiple Microsoft Teams classes, making it difficult to consistently monitor newly posted tasks and upcoming deadlines. Important assignment instructions can also be lengthy or contain multiple requirements that students may overlook. Manually checking each class and transferring assignment details into a personal task or calendar system can be repetitive and time-consuming. Teamly aims to centralize assignment information and use AI-assisted processing to help students understand, organize, and keep track of their academic requirements.

## Objectives

By the end of the semester, the proposed application aims to:

1. Develop a secure user authentication system that allows students to register, log in, manage their profiles, and securely log out of the application.

2. Implement Microsoft Graph integration that allows authorized users to retrieve their academic assignment information from supported Microsoft Teams Education services.

3. Develop a centralized assignment management system that allows users to view, add, edit, delete, categorize, and track their assignments.

4. Implement an assignment synchronization mechanism that identifies newly retrieved or updated assignments and records them in the application's database.

5. Implement AI-assisted assignment analysis that can summarize assignment instructions and identify important information such as requirements, deadlines, and expected submissions.

6. Develop a personalized dashboard that displays relevant assignment information, including newly detected assignments, upcoming deadlines, completed tasks, and overdue assignments.

7. Implement customizable notifications that alert users when new assignments are detected and when existing assignment deadlines are approaching.

8. Provide assignment filtering and sorting functionality based on subject, deadline, status, priority, and other relevant information.

9. Evaluate the application's functionality and usability through testing with representative student users before the end of the development period.

## Scope

### 1. User Authentication & Account Management

- **Register** - Allows new users to create an account by providing the required personal and account information.

- **Login** - Allows registered users to securely access their account and personalized assignment information.

- **Profile** - Allows users to view and manage personal information, academic information, and application preferences.

- **Logout** - Allows users to securely terminate their current application session.

### 2. Dashboard

- **Assignment Dashboard** - Displays an overview of the user's academic workload, including newly detected assignments, upcoming deadlines, completed assignments, and overdue tasks.

- **Assignment Statistics** - Displays summarized information such as the number of active, completed, and overdue assignments.

- **Upcoming Deadlines** - Displays assignments approaching their due dates so students can prioritize their workload.

- **Recent Assignment Activity** - Displays recently retrieved, added, or updated assignments.

### 3. Microsoft Teams Integration

- **Microsoft Account Connection** - Allows users to authorize the application to connect to their supported Microsoft school account.

- **Teams Assignment Synchronization** - Retrieves relevant assignment information from the user's Microsoft Teams Education environment through supported Microsoft Graph APIs.

- **New Assignment Detection** - Identifies newly retrieved assignments that have not previously been recorded in the application's database.

- **Assignment Update Detection** - Identifies changes to existing assignment information, such as modified instructions or deadlines.

- **Open in Microsoft Teams** - Provides a link that allows users to open the original assignment in Microsoft Teams for viewing or submission.

### 4. AI Assignment Assistant

- **AI Assignment Summarization** - Generates a concise summary of lengthy assignment instructions to help students quickly understand what the assignment requires.

- **Requirement Extraction** - Identifies important requirements from assignment instructions, such as required outputs, documents, programming tasks, or submission requirements.

- **Deadline & Information Extraction** - Assists in identifying important information contained in assignment instructions, including dates, times, and other relevant details.

- **AI-Generated Task Breakdown** - Provides suggested subtasks based on the requirements of an assignment to help students organize their work.

- **AI Assistance Disclaimer** - Clearly identifies AI-generated summaries and suggestions as assistance rather than authoritative replacements for the original professor-provided instructions.

### 5. Assignment Management

- **Assignment List** - Displays all assignments stored in the user's account.

- **Manual Assignment Creation** - Allows users to manually add assignments that are not available through Microsoft Teams.

- **Assignment Details** - Displays information such as title, subject, instructions, due date, status, priority, and submission information.

- **Assignment Status** - Allows users to track assignments as Not Started, In Progress, or Completed.

- **Edit Assignment** - Allows users to modify manually created or locally managed assignment information.

- **Delete Assignment** - Allows users to remove assignments that are no longer relevant.

- **Assignment Filtering & Sorting** - Allows users to organize assignments by subject, deadline, status, priority, or other relevant criteria.

### 6. Notifications

- **New Assignment Notification** - Notifies users when a new assignment has been detected through Microsoft Teams synchronization.

- **Upcoming Deadline Notification** - Notifies users when an assignment deadline is approaching.

- **Custom Notification Preferences** - Allows users to configure which notifications they want to receive and how early they want to be reminded.

## Limitations

1. The application will primarily target students using Microsoft Teams for Education through an authorized school or university Microsoft account.

2. Microsoft Teams integration will depend on the availability of the required Microsoft Graph Education APIs and the permissions granted by the user's Microsoft 365 organization.

3. The application will not directly modify, submit, grade, or delete assignments within Microsoft Teams unless the required Microsoft Graph permissions and functionality are officially available and included in the project scope.

4. The application will not guarantee immediate detection of newly posted assignments because synchronization and Microsoft Graph service availability may introduce delays.

5. AI-generated summaries, requirement extraction, and task suggestions may contain inaccuracies and will not replace the original assignment instructions provided by professors.

6. The application will not attempt to monitor or access private conversations, messages, or information unrelated to the user's academic assignments.

7. Advanced AI features such as automatically completing assignments, generating final submissions, or submitting work on behalf of students will not be included.

8. The application will focus primarily on assignment organization and academic workload management and will not function as a complete replacement for Microsoft Teams.

9. Development will be limited to features that can reasonably be implemented, tested, and evaluated within the semester's available time and resources.


## Current Academic Development Context

Teamly is the **approved proposed application** for the current semester's Information Management 2 project. The project is being developed progressively according to the laboratory requirements and the semester development schedule.

### Current Prelim Requirement — Django Foundation

The current Prelim examination focuses on establishing the foundational Django application structure rather than implementing the full Teamly feature set.

The required screens and navigation flow are:

```text
Login
  ↓
Register
  ↓
Login
  ↓
Home Screen
```

The current Prelim implementation must demonstrate:

- **Login Screen** - Provides the initial authentication interface.
- **Register Screen** - Provides the interface for creating a user account.
- **Home Screen** - Provides the authenticated landing screen. It may initially contain minimal content or simply display `HOME SCREEN`.

The current Prelim implementation should prioritize correct Django project structure, routing/navigation, Views, Templates, UI/UX integration, and foundational authentication flow. Full Microsoft Teams integration, AI processing, notifications, and the complete assignment-management system are **not required merely to satisfy the initial three-screen foundation** unless a later requirement explicitly calls for them.

## Architecture Direction

Teamly has two distinct architectural stages:

### Stage 1 — Current Django Web Foundation

```text
Browser
   ↓
Django URLs
   ↓
Django Views
   ↓
Django Templates
   ↓
Database / Application Logic
```

The current implementation should use Django's conventional Views, URLs, Templates, and backend structure. The web interface may be designed with a mobile-oriented/responsive visual style so that it remains consistent with Teamly's intended mobile product identity.

### Stage 2 — Intended Production Architecture

```text
React Native Mobile Application
            ↓
      Django REST API
            ↓
         Database
            ↓
   Microsoft Graph API
            ↓
     Microsoft Teams
            ↓
      AI Processing
```

The eventual React Native application is the planned production-facing mobile client. Django is expected to remain responsible for backend services, authentication, persistent data, API endpoints, business logic, synchronization, and integration with external services.

The transition from Django Templates to React Native should be treated as a **frontend evolution**, not as a complete replacement of the Django backend.

## Architectural Responsibilities

The intended responsibilities of each major component are:

### React Native
Responsible for the eventual mobile user experience, including screens, navigation, local interaction, assignment presentation, notification handling, and mobile-specific functionality.

### Django
Responsible for server-side application logic, authentication, authorization, database operations, assignment management, synchronization processes, API endpoints, and integration orchestration.

### Database
Responsible for persistent application data such as users, profiles, assignments, subjects/classes, statuses, priorities, notification preferences, synchronization records, and other application-owned information.

### Microsoft Graph
Responsible for retrieving authorized assignment information from supported Microsoft Teams Education services. Teamly should use official APIs and authorization mechanisms rather than attempting to scrape or intercept the Microsoft Teams client.

### AI Services
Responsible for processing assignment-related content for supported functions such as summarization, requirement extraction, information extraction, and suggested task breakdowns. AI output must be treated as assistive information rather than authoritative source data.

## Data Ownership & Source of Truth

Teamly should distinguish between information originating from Microsoft Teams and information created or managed inside Teamly.

### External Source Data

Assignment information retrieved through Microsoft Graph represents information originating from Microsoft Teams and should be preserved as the external source information.

### Teamly-Managed Data

Teamly may maintain its own application-specific information, including:

- Assignment status
- Priority
- Categories
- Personal notes
- Notification preferences
- Locally generated task breakdowns
- AI-generated summaries
- User-specific organization or tracking information

Teamly should avoid silently overwriting user-managed data when synchronization updates externally sourced assignment information.

## Synchronization Principles

Assignment synchronization is a core part of Teamly.

The synchronization process should:

1. Authenticate the user through the supported Microsoft account flow.
2. Retrieve authorized assignment information through Microsoft Graph.
3. Identify whether each assignment is new or already known.
4. Record new assignments in Teamly's database.
5. Detect relevant updates to existing assignments.
6. Preserve locally managed information where appropriate.
7. Trigger downstream processing such as AI analysis or notifications when applicable.
8. Record sufficient synchronization metadata to support troubleshooting and duplicate prevention.

The system should be designed so that repeated synchronization does not create duplicate copies of the same Microsoft Teams assignment.

## AI Design Principles

AI functionality should support the user's understanding and organization of assignments rather than replace the original academic source.

### AI should primarily assist with:

- Summarizing lengthy instructions
- Extracting requirements
- Extracting important dates and information
- Suggesting task breakdowns
- Organizing assignment-related information

### AI should not be treated as authoritative for:

- The original assignment instructions
- Official deadlines when a source-provided deadline exists
- Professor-provided requirements
- Assignment submission rules

The original Microsoft Teams assignment should remain accessible to the user so that AI-generated information can be verified against the source.

## Security & Privacy Principles

Teamly should follow least-privilege principles when handling user and Microsoft account data.

The application should:

- Require authentication for protected user-specific information.
- Keep users' assignment information isolated from other users.
- Avoid collecting unrelated Microsoft Teams content.
- Avoid accessing private messages or conversations that are outside the application's assignment-management purpose.
- Store application credentials and secrets outside source-controlled files.
- Avoid exposing Microsoft access tokens or sensitive credentials in the client interface, logs, or repository.
- Provide clear indications when information has been generated or processed by AI.

## UI/UX Direction

The current Django interface is a **foundation/prototype for a mobile-first product**.

Even though the Prelim implementation is browser-based, the interface should preferably:

- Use a responsive layout.
- Prioritize mobile-sized content and touch-friendly controls.
- Maintain Teamly's visual identity consistently across screens.
- Keep navigation simple and task-oriented.
- Avoid designing the Django prototype in a way that would make future React Native translation unnecessarily difficult.

The current implementation does not need to reproduce the complete production mobile UI.

## Implementation Priority

Development should follow a progressive vertical-slicing approach rather than attempting to implement every feature simultaneously.

Recommended priority:

```text
1. Django Project Foundation
        ↓
2. Login / Register / Home
        ↓
3. User Authentication & Profiles
        ↓
4. Database & Assignment Management
        ↓
5. Dashboard
        ↓
6. Microsoft Graph Integration
        ↓
7. Assignment Synchronization
        ↓
8. AI Assignment Processing
        ↓
9. Notifications
        ↓
10. React Native Production Client
```

A feature should only be treated as complete when its required backend, data, UI, validation, and error-handling behavior are sufficiently implemented for the current project stage.

## Current Development Boundaries

The existence of a feature in the approved full-project scope does not mean that feature must be implemented immediately.

During early development, prioritize the current academic requirement and the smallest functional slice that can be demonstrated. Avoid prematurely implementing complex external integrations or AI workflows before the underlying authentication, data model, routing, and application structure are stable.

The current project should remain extensible so that later stages can introduce Microsoft Graph, AI, notifications, and React Native without requiring unnecessary rewrites of the core domain model and backend logic.

## Non-Goals

The following are outside the core purpose of Teamly:

- Replacing Microsoft Teams as a complete communication platform
- Monitoring unrelated private communications
- Automatically completing academic assignments
- Generating final academic submissions on behalf of students
- Automatically submitting assignments without explicit user control
- Acting as an authoritative source when AI-generated information conflicts with the original assignment
- Building a general-purpose personal assistant unrelated to academic assignment management

## Platform & Development Roadmap

> **Important:** The final intended production version of **Teamly — Your Timely Academic Assignment Assistant** is planned as a **mobile application**, with **React Native** serving as the client-side/mobile interface and **Django** serving as the backend and API layer.

### Current Development Stage — Django Web Foundation

For the current development stage, Teamly is being implemented as a **Django web application** using Django's **Views, Templates, URLs, and backend structure**. This web-based implementation is intentional and serves as the foundational version of the application, particularly for establishing the required authentication, navigation flow, user management, and core application structure.

The current implementation should therefore use Django Templates for the UI/UX rather than React Native. The initial application flow consists of the required **Login, Register, and Home** screens, with additional functionality introduced progressively as development advances.

### Expected Production Roadmap

The long-term architecture is expected to evolve toward:

```text
React Native Mobile Application
            ↓
      Django REST API
            ↓
         Database
            ↓
   Microsoft Graph API
            ↓
     Microsoft Teams
            ↓
      AI Processing
```

The Django web application developed during the foundation stage should be treated as the **initial implementation of Teamly**, not as a replacement for the planned mobile application. Future development may migrate the frontend experience from Django Templates to React Native while retaining and expanding the Django backend, database, authentication, API, Microsoft Graph integration, and AI-related services.

### Development Principle

Features should be developed progressively according to the current project stage. **Do not prematurely implement the full production architecture when the current requirement only calls for the Django web foundation.** The present priority is to establish a clean, functional, and maintainable Django foundation that can later support Teamly's planned mobile architecture.

