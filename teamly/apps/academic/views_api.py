from django.db.models import Count, Q
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import AcademicTerm, Subject


class AcademicTermSerializer(serializers.ModelSerializer):
    subject_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = AcademicTerm
        fields = ("id", "name", "starts_on", "ends_on", "is_active", "subject_count")


class SubjectOptionSerializer(serializers.ModelSerializer):
    term = AcademicTermSerializer(read_only=True)
    assignment_count = serializers.IntegerField(read_only=True)
    active_assignment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = (
            "id",
            "name",
            "color",
            "teams_group_id",
            "term",
            "assignment_count",
            "active_assignment_count",
        )


class SubjectListApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subjects = (
            Subject.objects.filter(user=request.user)
            .select_related("term")
            .annotate(
                assignment_count=Count("assignments", distinct=True),
                active_assignment_count=Count(
                    "assignments",
                    filter=~Q(assignments__status__code="COMPLETED"),
                    distinct=True,
                ),
            )
            .order_by("-term__is_active", "-term__starts_on", "name")
        )
        return Response(SubjectOptionSerializer(subjects, many=True).data)


class TermListApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        terms = (
            AcademicTerm.objects.filter(subjects__user=request.user)
            .distinct()
            .annotate(
                subject_count=Count(
                    "subjects",
                    filter=Q(subjects__user=request.user),
                    distinct=True,
                )
            )
            .order_by("-is_active", "-starts_on")
        )
        return Response(AcademicTermSerializer(terms, many=True).data)
