from django.urls import path

from .views import assistant_view

app_name = "ai_assistant"

urlpatterns = [
    path("", assistant_view, name="assistant"),
]
