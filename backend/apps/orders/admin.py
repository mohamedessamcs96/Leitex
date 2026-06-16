from django.contrib import admin
from .models import Order, OrderLine, Payment, ClockEntry


class OrderLineInline(admin.TabularInline):
    model  = OrderLine
    extra  = 0
    fields = ['name', 'quantity', 'unit_price', 'kds_status', 'station', 'course']


class PaymentInline(admin.TabularInline):
    model  = Payment
    extra  = 0
    fields = ['method', 'amount', 'reference']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ['id', 'table', 'staff', 'type', 'status', 'discount', 'created_at']
    list_filter   = ['status', 'type']
    inlines       = [OrderLineInline, PaymentInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ClockEntry)
class ClockEntryAdmin(admin.ModelAdmin):
    list_display = ['staff', 'clocked_in', 'clocked_out']
    list_filter  = ['staff']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'method', 'amount', 'created_at']
