# Backward compatibility alias delegating to deep accounts module (ADR-0006)
from apps.accounts.views import settings_view

__all__ = ["settings_view"]
