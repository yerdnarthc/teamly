from django.contrib.auth import login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme

from .models import MicrosoftAccount


def login_view(request):
    """Provides secure session login with open-redirect protection."""
    if request.user.is_authenticated:
        return redirect("home:home")

    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            next_url = request.POST.get("next") or request.GET.get("next")
            if next_url and url_has_allowed_host_and_scheme(
                next_url, allowed_hosts={request.get_host()}
            ):
                return redirect(next_url)
            return redirect("home:home")
    else:
        form = AuthenticationForm()

    return render(request, "login/login.html", {"form": form})


def logout_view(request):
    """POST-only logout terminating current user session."""
    if request.method == "POST":
        auth_logout(request)
        return redirect("login:login")
    return render(request, "login/logout_confirm.html")


def register_view(request):
    """User registration view; redirects to login upon account creation."""
    if request.user.is_authenticated:
        return redirect("home:home")

    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login:login")
    else:
        form = UserCreationForm()

    return render(request, "register/register.html", {"form": form})


@login_required
def accounts_view(request):
    """Displays Microsoft connected account details and status."""
    ms_account = MicrosoftAccount.objects.filter(user=request.user).first()
    return render(request, "accounts/accounts.html", {"ms_account": ms_account})
