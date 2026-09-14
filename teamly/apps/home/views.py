from django.contrib.auth.decorators import login_required
from django.shortcuts import render

# Home slice: owns the authenticated landing screen only.


@login_required
def home_view(request):
    return render(request, "home/home.html")
