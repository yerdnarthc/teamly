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
