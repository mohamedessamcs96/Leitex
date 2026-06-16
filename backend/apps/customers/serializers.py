from rest_framework import serializers
from .models import Customer, LoyaltyTransaction, GiftCard, Reservation


class CustomerSerializer(serializers.ModelSerializer):
    full_name    = serializers.CharField(read_only=True)
    total_spent  = serializers.SerializerMethodField()
    order_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'notes', 'loyalty_points', 'loyalty_tier',
            'total_spent', 'order_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_spent(self, obj):
        try:
            return obj.total_spent
        except Exception:
            return 0

    def get_order_count(self, obj):
        try:
            return obj.orders.filter(status='PAID').count()
        except Exception:
            return 0


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LoyaltyTransaction
        fields = ['id', 'customer', 'type', 'points', 'reference', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = GiftCard
        fields = ['id', 'code', 'balance', 'initial_amount', 'issued_to', 'is_active', 'expires_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReservationSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model  = Reservation
        fields = [
            'id', 'customer', 'customer_name', 'guest_name', 'guest_phone', 'guest_email',
            'party_size', 'date', 'time', 'status', 'table', 'special_requests', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_customer_name(self, obj):
        return obj.customer.full_name if obj.customer else ''
