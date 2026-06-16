from rest_framework import serializers
from .models import Location, LocationStaff

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'
        read_only_fields = ['id','created_at']

class LocationStaffSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    class Meta:
        model = LocationStaff
        fields = ['id','location','staff','staff_name','is_manager','assigned_at']
        read_only_fields = ['id','assigned_at']
