from django.urls import path
from . import views

app_name = "assignments"

urlpatterns = [
    path("", views.assignments_view, name="list"),
    path("assignments/", views.assignments_view, name="assignments"),
    path("create/", views.assignment_create_view, name="create"),
    path("<int:pk>/", views.assignment_detail_view, name="detail"),
    path("<int:pk>/status/", views.assignment_update_status_view, name="update_status"),
    path("<int:pk>/delete/", views.assignment_delete_view, name="delete"),
]
