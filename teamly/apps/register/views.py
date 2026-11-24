# Register slice: alias for backward-compatible routing; implementation consolidated in apps.accounts.
from apps.accounts.views import register_view

__all__ = ["register_view"]
