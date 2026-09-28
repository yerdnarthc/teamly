from django.urls import path

from .views import academic_view

app_name = "academic"

urlpatterns = [
    path("", academic_view, name="academic"),
]
