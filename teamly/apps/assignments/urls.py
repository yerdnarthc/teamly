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
    path("<int:pk>/subtasks/add/", views.assignment_add_subtask_view, name="add_subtask"),
    path("<int:pk>/subtasks/<int:subtask_pk>/toggle/", views.assignment_toggle_subtask_view, name="toggle_subtask"),
    path("<int:pk>/notes/add/", views.assignment_add_note_view, name="add_note"),
]
