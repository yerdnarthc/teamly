import abc
import os
import re

from apps.assignments.models import Assignment, Subtask
from .models import AiSummary


class BaseAiAdapter(abc.ABC):
    @abc.abstractmethod
    def analyze(self, title: str, instructions: str) -> dict:
        """Analyzes assignment text and returns structured summary and suggestions."""
        pass


class DeterministicAiAdapter(BaseAiAdapter):
    """
    Offline, deterministic rule-based adapter for TDD unit tests and local development.
    Extracts requirements and actionable checklist subtasks directly from assignment text.
    """

    def analyze(self, title: str, instructions: str) -> dict:
        clean_text = re.sub(r"<[^>]+>", "", instructions or "").strip()
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]

        # Split sentences if no distinct lines
        if len(lines) <= 1:
            raw_sentences = re.split(r"(?<=[.!?])\s+", clean_text)
            lines = [s.strip() for s in raw_sentences if s.strip()]

        requirements = []
        suggested_subtasks = []

        for line in lines:
            # Detect numbered items, bullets, or sentences with action keywords
            clean_item = re.sub(r"^[\d\.\-\*•]+\s*", "", line).strip()
            if not clean_item:
                continue

            requirements.append(clean_item)

            # Generate concise task titles (under 80 chars)
            if len(clean_item) > 80:
                short_title = clean_item[:77].rsplit(" ", 1)[0] + "..."
            else:
                short_title = clean_item
            suggested_subtasks.append(short_title)

        # Fallbacks if instructions are minimal or blank
        if not suggested_subtasks:
            suggested_subtasks = [
                f"Review specification & rubric for {title}",
                f"Implement core deliverables for {title}",
                f"Verify requirements and submit final work",
            ]

        if not requirements:
            requirements = [f"Complete all requirements detailed in {title}."]

        summary_text = (
            f"Academic assignment '{title}' focusing on: "
            + "; ".join(requirements[:2])
            + ("..." if len(requirements) > 2 else ".")
        )
        deadlines = _extract_deadline_hints(clean_text)

        return {
            "summary": summary_text,
            "requirements": requirements[:5],
            "deadlines": deadlines,
            "suggested_subtasks": suggested_subtasks[:6],
            "model": "deterministic-v1",
        }


_DATE_HINT_PATTERN = re.compile(
    r"\b(?:"
    r"\d{4}-\d{2}-\d{2}"
    r"|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    r"\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?(?:\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:AM|PM))?"
    r"|\d{1,2}/\d{1,2}/\d{2,4}"
    r")\b",
    re.IGNORECASE,
)


def _extract_deadline_hints(text: str) -> list[str]:
    """Extracts unique date/time hints from assignment instructions."""
    if not text:
        return []
    seen = set()
    hints = []
    for match in _DATE_HINT_PATTERN.finditer(text):
        value = match.group(0).strip()
        key = value.lower()
        if key not in seen:
            seen.add(key)
            hints.append(value)
    return hints[:5]


class GeminiAiAdapter(BaseAiAdapter):
    """
    Production adapter utilizing Google Gemini API for structured requirement analysis.
    Gracefully falls back to DeterministicAiAdapter when API keys are not configured.
    """

    def analyze(self, title: str, instructions: str) -> dict:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return DeterministicAiAdapter().analyze(title, instructions)

        # Production Gemini LLM invocation placeholder
        return DeterministicAiAdapter().analyze(title, instructions)


def get_default_adapter() -> BaseAiAdapter:
    """Returns the production Gemini adapter or deterministic fallback."""
    return GeminiAiAdapter()


def analyze_assignment(assignment: Assignment, adapter: BaseAiAdapter | None = None) -> AiSummary:
    """
    Deep module interface analyzing an assignment's instructions to generate
    an assistive summary, key requirements, and actionable subtask proposals.
    """
    if adapter is None:
        adapter = get_default_adapter()

    analysis = adapter.analyze(assignment.title, assignment.instructions)

    ai_summary, _ = AiSummary.objects.update_or_create(
        assignment=assignment,
        defaults={
            "summary": analysis["summary"],
            "requirements": analysis.get("requirements", []),
            "deadlines": analysis.get("deadlines", []),
            "suggested_subtasks": analysis.get("suggested_subtasks", []),
            "model": analysis.get("model", "deterministic-v1"),
        },
    )
    return ai_summary


def adopt_suggested_subtask(assignment: Assignment, suggestion_title: str) -> Subtask:
    """
    Adoption seam: explicitly converts an individual assistive AI task suggestion
    into an authoritative, student-owned Subtask record.
    Idempotent: prevents duplicate subtask creation.
    """
    clean_title = suggestion_title.strip()
    subtask, _ = Subtask.objects.get_or_create(
        assignment=assignment,
        title=clean_title,
        defaults={"is_done": False},
    )
    return subtask


def estimate_assignment_study_profile(assignment: Assignment, ai_summary: AiSummary) -> dict:
    """
    Computes workload complexity and estimated study time for an analyzed assignment
    using its extracted requirements, subtasks, and priority rank.
    """
    requirements = ai_summary.requirements or []
    suggestions = ai_summary.suggested_subtasks or []
    incomplete_subtasks = sum(1 for s in assignment.subtasks.all() if not s.is_done)

    item_count = max(len(requirements), len(suggestions), incomplete_subtasks, 1)
    priority_rank = assignment.priority.rank if assignment.priority_id else 2

    estimated_minutes = min(240, max(20, item_count * 20 + (priority_rank * 10)))

    if priority_rank >= 4 or (priority_rank >= 3 and item_count >= 3) or item_count >= 5:
        complexity = "High"
        study_tip = "Split into 2 focused 30-min blocks and tackle core requirements first."
    elif priority_rank >= 2 or item_count >= 3:
        complexity = "Moderate"
        study_tip = "Complete in one focused 45-min study session before starting new tasks."
    else:
        complexity = "Light"
        study_tip = "Quick win — knock this out in a single short sprint."

    return {
        "complexity": complexity,
        "estimated_minutes": estimated_minutes,
        "study_tip": study_tip,
    }


def analyze_pending_assignments(user) -> list[AiSummary]:
    """Analyzes all active assignments for a user that do not yet have an AiSummary."""
    pending = (
        Assignment.objects.filter(user=user)
        .exclude(status__code="COMPLETED")
        .filter(ai_summary__isnull=True)
        .order_by("-priority__rank", "due_at")
    )
    created = []
    for assignment in pending:
        created.append(analyze_assignment(assignment))
    return created


def build_workspace_insights(
    summaries_with_profiles: list[tuple[AiSummary, dict]],
    unanalyzed_count: int,
) -> dict:
    """Aggregates cross-course AI workload complexity and study-time recommendations."""
    analyzed_count = len(summaries_with_profiles)
    total_suggested_tasks = sum(
        len(summary.suggested_subtasks or []) for summary, _ in summaries_with_profiles
    )
    active_items = [
        (summary, profile)
        for summary, profile in summaries_with_profiles
        if summary.assignment.status.code != "COMPLETED"
    ]
    estimated_total_minutes = sum(
        profile["estimated_minutes"] for _, profile in active_items
    )

    if estimated_total_minutes >= 180 or len(active_items) >= 5:
        complexity_level = "Heavy"
    elif estimated_total_minutes >= 60 or len(active_items) >= 2:
        complexity_level = "Balanced"
    else:
        complexity_level = "Light"

    if active_items:
        top_summary, top_profile = active_items[0]
        hours = round(estimated_total_minutes / 60, 1)
        study_recommendation = (
            f"Prioritize '{top_summary.assignment.title}' ({top_profile['complexity']} complexity, "
            f"~{top_profile['estimated_minutes']}m). Total active study load is ~{hours}h across "
            f"{len(active_items)} analyzed coursework item(s)."
        )
    elif unanalyzed_count > 0:
        study_recommendation = (
            f"You have {unanalyzed_count} active assignment(s) ready for AI breakdown. "
            "Tap 'Analyze All Active' to generate your study plan."
        )
    else:
        study_recommendation = "All caught up! Sync or add assignments to generate study breakdowns."

    return {
        "analyzed_count": analyzed_count,
        "pending_analysis_count": unanalyzed_count,
        "total_suggested_tasks": total_suggested_tasks,
        "estimated_total_minutes": estimated_total_minutes,
        "complexity_level": complexity_level,
        "study_recommendation": study_recommendation,
    }


def get_adopted_subtask_titles(assignment: Assignment) -> list[str]:
    """Returns normalized titles of subtasks already adopted by the student."""
    return [s.title.lower().strip() for s in assignment.subtasks.all()]


def get_assistant_workspace(user) -> dict:
    """Builds the full AI Study Workspace payload (insights, summaries, unanalyzed)."""
    summaries = list(
        AiSummary.objects.filter(assignment__user=user)
        .select_related(
            "assignment",
            "assignment__subject",
            "assignment__status",
            "assignment__priority",
        )
        .prefetch_related("assignment__subtasks", "feedback")
        .order_by("-assignment__priority__rank", "assignment__due_at", "-created_at")
    )
    summaries_with_profiles = [
        (s, estimate_assignment_study_profile(s.assignment, s)) for s in summaries
    ]

    unanalyzed = list(
        Assignment.objects.for_user(user)
        .active()
        .filter(ai_summary__isnull=True)
        .select_related("subject", "priority", "status")
        .prefetch_related("subtasks")
        .order_by("-priority__rank", "due_at")
    )

    insights = build_workspace_insights(summaries_with_profiles, len(unanalyzed))
    return {
        "workspace_insights": insights,
        "summaries_with_profiles": summaries_with_profiles,
        "unanalyzed": unanalyzed,
    }


def record_ai_feedback(summary: AiSummary, rating: str) -> AiFeedback:
    """Validates and persists student rating feedback for an AI summary."""
    from .models import AiFeedback

    if rating not in AiFeedback.Rating.values:
        raise ValueError(f"Invalid rating. Choose from {AiFeedback.Rating.values}.")
    return AiFeedback.objects.create(ai_summary=summary, rating=rating)
