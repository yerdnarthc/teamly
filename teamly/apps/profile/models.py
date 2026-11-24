# teamly/apps/profile/models.py

from django.conf import settings
from django.db import models

# Profile slice: owns user profile data. Kept separate from Home/Register
# so profile concerns never leak into other features.
#
# NOTE (guide extension): add `profile_image = models.ImageField(
# upload_to="profile/", blank=True, null=True)` here once Pillow is
# installed (`pip install Pillow` + add to requirements.txt).


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    # Full name is a composite attribute; divided into First Name, Middle Name, and Last Name.
    first_name = models.CharField(max_length=80, blank=True)    # First Name
    middle_name = models.CharField(max_length=80, blank=True)   # Middle Name
    last_name = models.CharField(max_length=80, blank=True)     # Last Name
    bio = models.TextField(blank=True)                          # Bio description

    class Meta:
        db_table = "profile_profile"

    def __str__(self): 
        return self.user.username
