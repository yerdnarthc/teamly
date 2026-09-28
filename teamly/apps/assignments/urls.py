from django.urls import path

from .views import assignments_view

app_name = "assignments"

urlpatterns = [
    path("", assignments_view, name="assignments"),
]
