from rest_framework import serializers
from .models import DeliveryZone, DeliveryOrder, QRTable

class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        fields = '__all__'

class DeliveryOrderSerializer(serializers.ModelSerializer):
    type_display     = serializers.CharField(source='get_type_display', read_only=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    status_display   = serializers.CharField(source='get_status_display', read_only=True)
    class Meta:
        model = DeliveryOrder
        fields = '__all__'
        read_only_fields = ['id','created_at','updated_at']

class QRTableSerializer(serializers.ModelSerializer):
    table_label = serializers.CharField(source='table.label', read_only=True)
    class Meta:
        model = QRTable
        fields = ['id','table','table_label','token','is_active','created_at']
        read_only_fields = ['id','created_at','token']
