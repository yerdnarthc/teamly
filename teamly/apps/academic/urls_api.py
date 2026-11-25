from django.urls import path
from .views_api import SubjectListApiView, TermListApiView

app_name = "api_v1_academic"

urlpatterns = [
    path("subjects/", SubjectListApiView.as_view(), name="subject-list"),
    path("terms/", TermListApiView.as_view(), name="term-list"),
]
