# Teamly Domain Model

Teamly is an academic assignment management platform that organizes, tracks, and assists students with tasks from Microsoft Teams and manual coursework.

## Language

**Assignment**:
An academic task, homework, project, or exam required for a course, either synchronized from Microsoft Teams or created manually by the student.
_Avoid_: Task, todo, job, ticket

**Subject**:
An academic course or class enrolled by a student within a specific academic term, mapped to a Microsoft Teams group.
_Avoid_: Course, class, module

**Academic Term**:
A defined school period (semester, trimester, or quarter) during which subjects are active.
_Avoid_: Semester, period, session

**External Source Data**:
Assignment and class information originating directly from Microsoft Teams Education via Microsoft Graph APIs. This data represents authoritative source requirements and is immutable by local sync edits.
_Avoid_: Remote data, Teams raw data, upstream data

**Teamly-Managed Data**:
Student-owned application state such as assignment status, priority, personal notes, subtasks, tags, and custom reminders.
_Avoid_: Local data, user overrides

**Subtask**:
A student-managed checklist item belonging to an assignment with a title and completion state. Can be created manually or adopted from AI suggestions, but once created is owned exclusively by the student.
_Avoid_: Todo, checklist item, step

**Personal Note**:
A private, timestamped text entry recorded by a student against an assignment for personal thoughts, meeting notes, or professor clarifications.
_Avoid_: Comment, memo, scratchpad

**Attachment**:
A file, link, rubric, template, or specification associated with an assignment. Distinctly differentiated between external source assets from Microsoft Teams (read-only) and student-added resources (manageable).
_Avoid_: File, link, resource, document

**Workload Metrics**:
Aggregated statistical indicators (total, active, completed, overdue, upcoming, and recent) summarizing a student's academic task load.
_Avoid_: Dashboard stats, summary numbers, KPIs

**Active Assignment**:
An assignment whose status is not completed.
_Avoid_: Open task, pending assignment, unfinished task

**Overdue Assignment**:
An active assignment whose deadline timestamp has passed without completion.
_Avoid_: Late task, expired assignment

**Upcoming Assignment**:
An active assignment with a deadline timestamp in the future, ordered chronologically.
_Avoid_: Next assignment, future task

**Connected Microsoft Account**:
A linked student Microsoft 365 Education authorization profile (tenant, Teams user ID, granted scopes) enabling automated assignment synchronization.
_Avoid_: Linked account, SSO profile, Teams login

**Notification Preference**:
Student-configured alert rules determining whether new assignment announcements and upcoming deadline alerts are dispatched, including the lead-time window in hours.
_Avoid_: Notification setting, alert rule

**Deadline Reminder**:
A scheduled alert event configured for an assignment approaching its deadline, calculated from the student's preferred lead time.
_Avoid_: Alert, ping, notification item



