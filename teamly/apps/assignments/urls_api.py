from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views_api import AssignmentViewSet, SubtaskToggleApiView

app_name = "api_v1_assignments"

router = DefaultRouter()
router.register(r"", AssignmentViewSet, basename="assignment")

urlpatterns = [
    path("subtasks/<int:pk>/toggle/", SubtaskToggleApiView.as_view(), name="subtask-toggle"),
    path("", include(router.urls)),
]
