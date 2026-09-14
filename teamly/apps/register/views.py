from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect, render

# Register slice: owns account creation. Redirects to Login (no auto-login)
# so the full Login -> Register -> Login -> Home sequence stays demoable.


def register_view(request):
    # If already logged in, send them straight home.
    if request.user.is_authenticated:
        return redirect("home:home")

    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login:login")
        # Invalid: fall through to re-render with errors shown.
    else:
        form = UserCreationForm()

    return render(request, "register/register.html", {"form": form})
