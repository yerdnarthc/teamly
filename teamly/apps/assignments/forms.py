from django import forms
from .models import Assignment


class AssignmentForm(forms.ModelForm):
    class Meta:
        model = Assignment
        fields = [
            "title",
            "subject",
            "status",
            "priority",
            "due_at",
            "instructions",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"placeholder": "e.g., Lab Exercise 4"}),
            "due_at": forms.DateTimeInput(
                attrs={"type": "datetime-local"},
                format="%Y-%m-%dT%H:%M",
            ),
            "instructions": forms.Textarea(
                attrs={"rows": 4, "placeholder": "Enter assignment instructions or requirements..."}
            ),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)
        if user is not None:
            self.fields["subject"].queryset = self.fields["subject"].queryset.filter(user=user)
        self.fields["due_at"].input_formats = ["%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]
