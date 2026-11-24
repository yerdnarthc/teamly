from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)

from .models import AccountPreference
from .serializers import AccountPreferenceSerializer, RegisterSerializer


class ApiAccountPreferenceView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountPreferenceSerializer

    def get_object(self):
        pref, _ = AccountPreference.objects.get_or_create(user=self.request.user)
        return pref


class ApiRegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "access": user.access,
                "refresh": user.refresh,
            },
            status=status.HTTP_201_CREATED,
        )
