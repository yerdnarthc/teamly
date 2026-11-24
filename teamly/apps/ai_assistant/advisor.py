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

        return {
            "summary": summary_text,
            "requirements": requirements[:5],
            "deadlines": [],
            "suggested_subtasks": suggested_subtasks[:6],
            "model": "deterministic-v1",
        }


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
