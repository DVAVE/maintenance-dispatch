from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import MaintenanceRequest


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'role']

    def get_role(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.role if profile else None


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'title', 'description', 'status',
            'created_by', 'assigned_to', 'assigned_to_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_created_by(self, obj):
        if obj.created_by:
            return {'id': obj.created_by.id, 'username': obj.created_by.username}
        return None

    def get_assigned_to(self, obj):
        if obj.assigned_to:
            return {'id': obj.assigned_to.id, 'username': obj.assigned_to.username}
        return None

    def to_representation(self, instance):
        """Full user dicts on read; assigned_to_id is write-only so excluded automatically."""
        return super().to_representation(instance)

    def create(self, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        instance = super().create(validated_data)
        if assigned_to_id is not None:
            try:
                instance.assigned_to = User.objects.get(id=assigned_to_id)
                instance.save()
            except User.DoesNotExist:
                pass
        return instance

    def update(self, instance, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        instance = super().update(instance, validated_data)
        if assigned_to_id is not None:
            try:
                instance.assigned_to = User.objects.get(id=assigned_to_id)
                instance.save()
            except User.DoesNotExist:
                pass
        return instance


class StaffStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = ['status']

    def validate_status(self, value):
        if value == 'Pending':
            raise serializers.ValidationError('Staff cannot set status back to Pending.')
        return value
