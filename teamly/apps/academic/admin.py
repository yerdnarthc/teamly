from django.contrib import admin

from .models import AcademicTerm, Subject


@admin.register(AcademicTerm)
class AcademicTermAdmin(admin.ModelAdmin):
    list_display = ("name", "starts_on", "ends_on", "is_active")
    list_filter = ("is_active",)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "term", "teams_group_id")
    search_fields = ("name", "teams_group_id")
