from rest_framework import serializers

from apps.academic.models import Subject
from apps.ai_assistant.models import AiSummary
from .models import Assignment, Priority, Status, Subtask


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ("id", "code", "label")


class PrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = Priority
        fields = ("id", "code", "rank")


class SubjectBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name", "color", "teams_group_id")


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ("id", "title", "is_done", "sort_order")
        read_only_fields = ("id",)


class AiSummaryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiSummary
        fields = ("summary", "requirements", "deadlines", "suggested_subtasks", "model", "created_at")


class AssignmentListSerializer(serializers.ModelSerializer):
    status = StatusSerializer(read_only=True)
    priority = PrioritySerializer(read_only=True)
    subject = SubjectBriefSerializer(read_only=True)
    subtask_count = serializers.IntegerField(source="subtasks.count", read_only=True)
    completed_subtask_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "due_at",
            "source",
            "status",
            "priority",
            "subject",
            "subtask_count",
            "completed_subtask_count",
            "created_at",
            "updated_at",
        )

    def get_completed_subtask_count(self, obj) -> int:
        return obj.subtasks.filter(is_done=True).count()


class AssignmentDetailSerializer(serializers.ModelSerializer):
    status = StatusSerializer(read_only=True)
    priority = PrioritySerializer(read_only=True)
    subject = SubjectBriefSerializer(read_only=True)
    subtasks = SubtaskSerializer(many=True, read_only=True)
    ai_summary = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "instructions",
            "due_at",
            "source",
            "teams_id",
            "teams_url",
            "status",
            "priority",
            "subject",
            "subtasks",
            "ai_summary",
            "created_at",
            "updated_at",
        )

    def get_ai_summary(self, obj):
        try:
            return AiSummaryBriefSerializer(obj.ai_summary).data
        except Assignment.ai_summary.RelatedObjectDoesNotExist:
            return None


class AssignmentCreateUpdateSerializer(serializers.ModelSerializer):
    subject_id = serializers.IntegerField(required=False, allow_null=True)
    status_code = serializers.CharField(required=False)
    priority_code = serializers.CharField(required=False)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "instructions",
            "due_at",
            "subject_id",
            "status_code",
            "priority_code",
        )

    def validate_status_code(self, value):
        try:
            return Status.objects.get(code=value)
        except Status.DoesNotExist:
            raise serializers.ValidationError(f"Invalid status code: {value}")

    def validate_priority_code(self, value):
        try:
            return Priority.objects.get(code=value)
        except Priority.DoesNotExist:
            raise serializers.ValidationError(f"Invalid priority code: {value}")

    def validate_subject_id(self, value):
        if value is None:
            return None
        user = self.context["request"].user
        try:
            return Subject.objects.get(id=value, user=user)
        except Subject.DoesNotExist:
            raise serializers.ValidationError(f"Subject with id {value} not found for current user.")

    def create(self, validated_data):
        user = self.context["request"].user
        status = validated_data.pop("status_code", None) or Status.objects.get(code="NOT_STARTED")
        priority = validated_data.pop("priority_code", None) or Priority.objects.get(code="MED")
        subject = validated_data.pop("subject_id", None)

        return Assignment.objects.create(
            user=user,
            status=status,
            priority=priority,
            subject=subject,
            **validated_data,
        )

    def update(self, instance, validated_data):
        if "status_code" in validated_data:
            instance.status = validated_data.pop("status_code")
        if "priority_code" in validated_data:
            instance.priority = validated_data.pop("priority_code")
        if "subject_id" in validated_data:
            instance.subject = validated_data.pop("subject_id")

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        instance.save()
        return instance
