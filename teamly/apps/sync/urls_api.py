from django.urls import path
from .views_api import SyncHistoryApiView, SyncTeamsApiView

app_name = "api_v1_sync"

urlpatterns = [
    path("teams/", SyncTeamsApiView.as_view(), name="sync-teams"),
    path("history/", SyncHistoryApiView.as_view(), name="sync-history"),
]
