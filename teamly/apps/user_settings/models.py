from django.contrib.auth.models import User
from django.db import models

# Settings slice: owns user preferences. Separate from Profile so each
# business capability keeps its own data and screen.


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    dark_mode = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"Settings for {self.user.username}"
