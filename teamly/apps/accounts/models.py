# teamly/apps/accounts/models.py

from django.conf import settings
from django.db import models

class MicrosoftAccount(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="microsoft_account")
    teams_user_id = models.CharField(max_length=64, unique=True)
    tenant_id = models.CharField(max_length=64)
    scopes_granted = models.TextField()
    connected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "microsoft_account"    

    def __str__(self):
        return f"Microsoft account for {self.user.username}"


class AccountPreference(models.Model):
    class ThemeMode(models.TextChoices):
        SYSTEM = "SYSTEM", "Match System (Automatic)"
        LIGHT = "LIGHT", "Light Mode"
        DARK = "DARK", "Dark Mode"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="account_preference",
    )
    theme = models.CharField(
        max_length=10,
        choices=ThemeMode.choices,
        default=ThemeMode.SYSTEM,
    )

    class Meta:
        db_table = "account_preference"

    def __str__(self):
        return f"{self.user.username} preference ({self.theme})"
