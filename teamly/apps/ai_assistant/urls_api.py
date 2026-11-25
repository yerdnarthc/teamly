from django.urls import path
from .views_api import (
    AssistantAnalyzeAllApiView,
    AssistantAnalyzeApiView,
    AssistantFeedbackApiView,
    AssistantWorkspaceApiView,
)

app_name = "api_v1_assistant"

urlpatterns = [
    path("", AssistantWorkspaceApiView.as_view(), name="workspace"),
    path("analyze/<int:assignment_id>/", AssistantAnalyzeApiView.as_view(), name="analyze"),
    path("analyze-all/", AssistantAnalyzeAllApiView.as_view(), name="analyze-all"),
    path("summaries/<int:pk>/feedback/", AssistantFeedbackApiView.as_view(), name="feedback"),
]
