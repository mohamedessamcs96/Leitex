from django.contrib import admin
from .models import DeliveryZone, DeliveryOrder, QRTable

@admin.register(DeliveryZone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name','delivery_fee','min_order','est_minutes','is_active']

@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    list_display = ['customer_name','type','platform','status','created_at']
    list_filter  = ['type','platform','status']

@admin.register(QRTable)
class QRAdmin(admin.ModelAdmin):
    list_display = ['table','token','is_active']
