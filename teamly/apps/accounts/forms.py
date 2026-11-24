from django import forms
from .models import AccountPreference


class AccountPreferenceForm(forms.ModelForm):
    class Meta:
        model = AccountPreference
        fields = ["theme"]
        widgets = {
            "theme": forms.RadioSelect(),
        }
