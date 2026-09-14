from django.contrib.auth.models import User
from django.db import models

# Profile slice: owns user profile data. Kept separate from Home/Register
# so profile concerns never leak into other features.
#
# NOTE (guide extension): add `profile_image = models.ImageField(
# upload_to="profile/", blank=True, null=True)` here once Pillow is
# installed (`pip install Pillow` + add to requirements.txt).


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.user.username
