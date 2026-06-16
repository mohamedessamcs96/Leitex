from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import StaffMember, ShiftSession


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StaffMember
        fields = ['id', 'username', 'name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class StaffCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StaffMember
        fields = ['username', 'name', 'role', 'pin']

    def create(self, validated_data):
        return StaffMember.objects.create_user(**validated_data)


class ShiftSessionSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)

    class Meta:
        model  = ShiftSession
        fields = ['id', 'staff', 'staff_name', 'started_at', 'ended_at', 'notes']
        read_only_fields = ['id', 'started_at']


class PinLoginSerializer(serializers.Serializer):
    pin = serializers.CharField(max_length=10)


class StaffTokenObtainSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer — also accepts PIN-based login."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name']     = user.name
        token['role']     = user.role
        token['staff_id'] = user.id
        return token
