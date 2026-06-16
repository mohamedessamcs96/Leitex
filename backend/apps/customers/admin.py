from django.contrib import admin
from .models import Customer, LoyaltyTransaction, GiftCard, Reservation

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display  = ['full_name','email','phone','loyalty_tier','loyalty_points','created_at']
    search_fields = ['first_name','last_name','email','phone']
    list_filter   = ['loyalty_tier']

@admin.register(GiftCard)
class GiftCardAdmin(admin.ModelAdmin):
    list_display = ['code','balance','issued_to','is_active','expires_at']

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['guest_name','date','time','party_size','status','table']
    list_filter  = ['status','date']
