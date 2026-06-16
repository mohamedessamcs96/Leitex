from rest_framework import serializers
from .models import SubscriptionPlan, OrganizationSubscription, AddOn

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class AddOnSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class Meta:
        model = AddOn
        fields = '__all__'
        read_only_fields = ['id','added_at']

class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    plan_name     = serializers.CharField(source='plan.name', read_only=True)
    monthly_total = serializers.FloatField(read_only=True)
    is_trial      = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    addons        = AddOnSerializer(many=True, read_only=True)

    class Meta:
        model = OrganizationSubscription
        fields = '__all__'
        read_only_fields = ['id','created_at']
