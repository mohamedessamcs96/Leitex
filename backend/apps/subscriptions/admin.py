from django.contrib import admin
from .models import SubscriptionPlan, OrganizationSubscription, AddOn

class AddOnInline(admin.TabularInline):
    model = AddOn
    extra = 0

@admin.register(SubscriptionPlan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name','tier','price_monthly','price_yearly','is_active']
    list_editable = ['is_active']

@admin.register(OrganizationSubscription)
class OrgSubAdmin(admin.ModelAdmin):
    list_display = ['org_name','plan','status','billing_cycle','seats','created_at']
    list_filter  = ['status','billing_cycle']
    inlines      = [AddOnInline]
