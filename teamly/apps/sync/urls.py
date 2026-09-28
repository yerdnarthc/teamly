from django.urls import path

from .views import sync_view

app_name = "sync"

urlpatterns = [
    path("", sync_view, name="sync"),
]
