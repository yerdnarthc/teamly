from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from .forms import UserSettingsForm
from .models import UserSettings

# Settings slice: owns the settings screen and preferences data.


@login_required
def settings_view(request):
    settings, _ = UserSettings.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = UserSettingsForm(request.POST, instance=settings)
        if form.is_valid():
            form.save()
            return redirect("user_settings:settings")
    else:
        form = UserSettingsForm(instance=settings)

    return render(
        request,
        "user_settings/settings.html",
        {"form": form, "settings": settings},
    )
