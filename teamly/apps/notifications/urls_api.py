from django.urls import path

from .views_api import (
    ApiNotificationPreferenceView,
    NotificationHistoryApiView,
    ReminderDismissApiView,
)

app_name = "api_v1_notifications"

urlpatterns = [
    path("preferences/", ApiNotificationPreferenceView.as_view(), name="preferences"),
    path("history/", NotificationHistoryApiView.as_view(), name="history"),
    path("reminders/<int:pk>/", ReminderDismissApiView.as_view(), name="reminder-detail"),
]
