from django import forms

from .models import NotificationPreference


class NotificationPreferenceForm(forms.ModelForm):
    class Meta:
        model = NotificationPreference
        fields = ["new_assignment", "deadline_enabled", "lead_hours"]
        labels = {
            "new_assignment": "New assignment detected notifications",
            "deadline_enabled": "Upcoming deadline alert reminders",
            "lead_hours": "Reminder lead time (hours before due)",
        }
        help_texts = {
            "lead_hours": "Hours before deadline to schedule reminders (e.g. 24 or 48).",
        }
