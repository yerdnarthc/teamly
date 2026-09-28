# teamly/apps/academic/models.py

from django.conf import settings
from django.db import models


class AcademicTerm(models.Model):
    name = models.CharField(max_length=40, unique=True)
    starts_on = models.DateField()
    ends_on = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "academic_term"

    def __str__(self):
        return self.name


class Subject(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    term = models.ForeignKey(
        AcademicTerm,
        on_delete=models.PROTECT,
        related_name="subjects",
    )
    name = models.CharField(max_length=120)
    teams_group_id = models.CharField(max_length=64, unique=True)
    color = models.CharField(max_length=7, blank=True)

    class Meta:
        db_table = "subject"

    def __str__(self):
        return self.name
