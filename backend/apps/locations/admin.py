from django.contrib import admin
from .models import Location, LocationStaff

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name','city','is_active','is_main','currency']
    list_editable = ['is_active']
