from django.urls import path
from .views_api import SubjectListApiView

app_name = "api_v1_academic"

urlpatterns = [
    path("subjects/", SubjectListApiView.as_view(), name="subject-list"),
]
