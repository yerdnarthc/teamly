from rest_framework import permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.academic.models import Subject


class SubjectOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name", "color", "teams_group_id")


class SubjectListApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subjects = Subject.objects.filter(user=request.user).order_by("name")
        return Response(SubjectOptionSerializer(subjects, many=True).data)
