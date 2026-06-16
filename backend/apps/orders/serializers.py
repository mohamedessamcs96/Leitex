from rest_framework import serializers
from .models import Order, OrderLine, Payment, ClockEntry


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Payment
        fields = ['id','method','amount','reference','created_at']
        read_only_fields = ['id','created_at']


class OrderLineSerializer(serializers.ModelSerializer):
    line_total = serializers.IntegerField(read_only=True)
    class Meta:
        model  = OrderLine
        fields = ['id','menu_item','name','quantity','unit_price','mod_options','note','kds_status','station','course','line_total']
        read_only_fields = ['id','line_total']


class OrderSerializer(serializers.ModelSerializer):
    lines         = OrderLineSerializer(many=True, read_only=True)
    payments      = PaymentSerializer(many=True, read_only=True)
    subtotal      = serializers.IntegerField(read_only=True)
    total         = serializers.IntegerField(read_only=True)
    staff_name    = serializers.CharField(source='staff.name', read_only=True, default='')
    table_label   = serializers.CharField(source='table.label', read_only=True, default='')
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = ['id','table','table_label','staff','staff_name','customer','customer_name',
                  'status','type','discount','notes','course','subtotal','total',
                  'lines','payments','created_at','updated_at','closed_at']
        read_only_fields = ['id','created_at','updated_at']

    def get_customer_name(self, obj):
        return obj.customer.full_name if obj.customer else ''


class CreateOrderLineSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    name         = serializers.CharField()
    quantity     = serializers.IntegerField(min_value=1)
    unit_price   = serializers.IntegerField(min_value=0)
    mod_options  = serializers.ListField(child=serializers.CharField(), default=list)
    note         = serializers.CharField(allow_blank=True, default='')
    station      = serializers.CharField(default='kitchen')
    course       = serializers.IntegerField(default=1)


class CreateOrderSerializer(serializers.Serializer):
    table_id    = serializers.IntegerField(required=False, allow_null=True)
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    type        = serializers.ChoiceField(choices=['DINE_IN','TAKEAWAY','DELIVERY'], default='DINE_IN')
    lines       = CreateOrderLineSerializer(many=True)
    discount    = serializers.IntegerField(min_value=0, default=0)
    notes       = serializers.CharField(allow_blank=True, default='')


class AddLineSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    name         = serializers.CharField()
    quantity     = serializers.IntegerField(min_value=1, default=1)
    unit_price   = serializers.IntegerField(min_value=0)
    mod_options  = serializers.ListField(child=serializers.CharField(), default=list)
    note         = serializers.CharField(allow_blank=True, default='')
    station      = serializers.CharField(default='kitchen')
    course       = serializers.IntegerField(default=1)


class KDSStatusSerializer(serializers.Serializer):
    kds_status = serializers.ChoiceField(choices=['PENDING','COOKING','READY','SERVED'])


class ProcessPaymentSerializer(serializers.Serializer):
    method    = serializers.ChoiceField(choices=['CASH','CARD','SPLIT','VOUCHER','GIFT_CARD','LOYALTY'])
    amount    = serializers.IntegerField(min_value=1)
    reference = serializers.CharField(allow_blank=True, default='')


class ClockEntrySerializer(serializers.ModelSerializer):
    staff_name       = serializers.CharField(source='staff.name', read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    class Meta:
        model  = ClockEntry
        fields = ['id','staff','staff_name','clocked_in','clocked_out','notes','duration_minutes']
        read_only_fields = ['id']
