from django.urls import path

from . import views

app_name = "sync"

urlpatterns = [
    path("", views.sync_view, name="sync"),
    path("trigger/", views.sync_trigger_view, name="trigger"),
]

