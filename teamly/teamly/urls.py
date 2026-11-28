"""
URL configuration for teamly project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.views.generic.base import RedirectView

# Vertical slicing: each feature owns its URLconf; config only includes them.
urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1 Endpoints (Headless Mobile Client)
    path("api/v1/auth/", include("apps.accounts.urls_api")),
    path("api/v1/profile/", include("apps.profile.urls_api")),
    path("api/v1/notifications/", include("apps.notifications.urls_api")),
    path("api/v1/assignments/", include("apps.assignments.urls_api")),
    path("api/v1/academic/", include("apps.academic.urls_api")),
    path("api/v1/assistant/", include("apps.ai_assistant.urls_api")),
    path("api/v1/sync/", include("apps.sync.urls_api")),
    # SSR Web Endpoints (Coexisting Hybrid)
    path("accounts/", include("apps.accounts.urls")),
    path("login/", include("apps.login.urls")),
    path("register/", include("apps.register.urls")),
    path("home/", include("apps.home.urls")),
    path("profile/", include("apps.profile.urls")),
    path("settings/", include("apps.user_settings.urls")),
    path("academic/", include("apps.academic.urls")),
    path("assignments/", include("apps.assignments.urls")),
    path("assistant/", include("apps.ai_assistant.urls")),
    path("sync/", include("apps.sync.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("", RedirectView.as_view(pattern_name="home:home", permanent=False)),
]
