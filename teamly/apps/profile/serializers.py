from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    microsoft_account = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "username",
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "bio",
            "microsoft_account",
        )

    def get_microsoft_account(self, obj):
        ms_account = getattr(obj.user, "microsoft_account", None)
        if ms_account:
            return {
                "is_connected": True,
                "teams_user_id": ms_account.teams_user_id,
                "tenant_id": ms_account.tenant_id,
                "connected_at": ms_account.connected_at,
            }
        return {
            "is_connected": False,
            "teams_user_id": "",
            "tenant_id": "",
            "connected_at": None,
        }
