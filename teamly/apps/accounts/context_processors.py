def theme_context(request):
    """Provides user_theme ('system', 'light', or 'dark') to all templates."""
    if hasattr(request, "user") and request.user.is_authenticated:
        pref = getattr(request.user, "account_preference", None)
        if pref and pref.theme:
            return {"user_theme": pref.theme.lower()}
    return {"user_theme": "system"}
