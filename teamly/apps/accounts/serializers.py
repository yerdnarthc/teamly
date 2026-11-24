from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AccountPreference


class AccountPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountPreference
        fields = ("theme",)

    def validate_theme(self, value):
        if value not in AccountPreference.ThemeMode.values:
            raise serializers.ValidationError(
                f"Invalid theme mode. Choose from {AccountPreference.ThemeMode.values}"
            )
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "access", "refresh")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        refresh = RefreshToken.for_user(user)
        user.access = str(refresh.access_token)
        user.refresh = str(refresh)
        return user
