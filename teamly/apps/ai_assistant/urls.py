from django.urls import path
from . import views

app_name = "ai_assistant"

urlpatterns = [
    path("", views.assistant_view, name="assistant"),
    path("assignments/<int:pk>/analyze/", views.analyze_view, name="analyze"),
    path("assignments/<int:pk>/adopt/", views.adopt_subtask_view, name="adopt"),
    path("summaries/<int:pk>/feedback/", views.feedback_view, name="feedback"),
]
