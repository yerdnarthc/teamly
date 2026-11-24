from django.urls import path

from .views import notifications_view

app_name = "notifications"

urlpatterns = [
    path("", notifications_view, name="notifications"),
]
