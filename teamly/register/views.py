from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, logout
from django.utils.http import url_has_allowed_host_and_scheme

# Create your views here.
def register(request):
    # If already logged in, send them straight home.
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login")
        # Invalid: fall through to re-render with errors shown.
    else:
        form = UserCreationForm()

    return render(request, "register/register.html", {"form": form})


def login_view(request):
    # AuthenticationForm already validates username/password for us.
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            next_url = request.POST.get("next") or request.GET.get("next")
            # Only follow local next URLs — blocks login/?next=https://evil/ redirects.
            if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
                return redirect(next_url)
            return redirect("home")
    else:
        form = AuthenticationForm()

    return render(request, "register/login.html", {"form": form})


def logout_view(request):
    # POST-only so a stray link prefetch can't log the user out.
    if request.method == "POST":
        logout(request)
        return redirect("login")
    return render(request, "register/logout_confirm.html")
