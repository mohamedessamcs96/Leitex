from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import StaffMember, ShiftSession


@admin.register(StaffMember)
class StaffAdmin(BaseUserAdmin):
    list_display   = ['name', 'username', 'role', 'is_active']
    list_filter    = ['role', 'is_active']
    search_fields  = ['name', 'username']
    ordering       = ['name']
    filter_horizontal = ('groups', 'user_permissions',)

    fieldsets = (
        (None,         {'fields': ('username', 'password')}),
        ('Personal',   {'fields': ('name', 'role', 'pin')}),
        ('Permissions',{'fields': ('is_active', 'is_admin', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'name', 'role', 'pin', 'password1', 'password2'),
        }),
    )


@admin.register(ShiftSession)
class ShiftSessionAdmin(admin.ModelAdmin):
    list_display = ['staff', 'started_at', 'ended_at']
    list_filter  = ['staff']
