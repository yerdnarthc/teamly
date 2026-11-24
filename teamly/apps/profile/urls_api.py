from django.urls import path

from .views_api import ApiProfileView

app_name = "api_v1_profile"

urlpatterns = [
    path("", ApiProfileView.as_view(), name="profile"),
]
