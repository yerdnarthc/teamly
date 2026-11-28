from django.db import migrations, models
from django.db.models import Count, Q


def deduplicate_unsent_reminders(apps, schema_editor):
    Reminder = apps.get_model("notifications", "Reminder")
    dups = (
        Reminder.objects.filter(is_sent=False)
        .values("user_id", "assignment_id")
        .annotate(cnt=Count("id"))
        .filter(cnt__gt=1)
    )
    for dup in dups:
        ids = list(
            Reminder.objects.filter(
                user_id=dup["user_id"],
                assignment_id=dup["assignment_id"],
                is_sent=False,
            )
            .order_by("id")
            .values_list("id", flat=True)
        )
        if len(ids) > 1:
            Reminder.objects.filter(id__in=ids[1:]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_notificationpreference"),
    ]

    operations = [
        migrations.RunPython(
            deduplicate_unsent_reminders,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="reminder",
            constraint=models.UniqueConstraint(
                condition=Q(is_sent=False),
                fields=("user", "assignment"),
                name="uniq_unsent_reminder_per_user_assignment",
            ),
        ),
    ]
