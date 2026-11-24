from django.urls import path
from .views_api import SyncTeamsApiView

app_name = "api_v1_sync"

urlpatterns = [
    path("teams/", SyncTeamsApiView.as_view(), name="sync-teams"),
]
