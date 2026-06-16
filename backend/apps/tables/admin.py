from django.contrib import admin
from .models import RestaurantTable

@admin.register(RestaurantTable)
class TableAdmin(admin.ModelAdmin):
    list_display = ['label', 'seats', 'status', 'zone', 'is_active']
    list_editable = ['status', 'is_active']
    list_filter = ['status', 'zone']
