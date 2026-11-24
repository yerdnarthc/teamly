from django.urls import path

from .views_api import ApiNotificationPreferenceView

app_name = "api_v1_notifications"

urlpatterns = [
    path("preferences/", ApiNotificationPreferenceView.as_view(), name="preferences"),
]
