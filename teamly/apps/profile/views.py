from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from .forms import ProfileForm
from .models import Profile

# Profile slice: owns the profile screen and profile data.


@login_required
def profile_view(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = ProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            return redirect("profile:profile")
    else:
        form = ProfileForm(instance=profile)

    return render(
        request, "profile/profile.html", {"form": form, "profile": profile}
    )
