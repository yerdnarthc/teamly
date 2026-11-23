# Login slice: alias for backward-compatible routing; implementation consolidated in apps.accounts.
from apps.accounts.views import login_view, logout_view

__all__ = ["login_view", "logout_view"]
