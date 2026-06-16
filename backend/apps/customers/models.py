from django.db import models
from django.db.models import Sum, F


class Customer(models.Model):
    first_name     = models.CharField(max_length=80)
    last_name      = models.CharField(max_length=80)
    email          = models.EmailField(unique=True, null=True, blank=True)
    phone          = models.CharField(max_length=30, blank=True)
    date_of_birth  = models.DateField(null=True, blank=True)
    notes          = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    loyalty_points = models.PositiveIntegerField(default=0)
    loyalty_tier   = models.CharField(
        max_length=20,
        choices=[('BRONZE','Bronze'),('SILVER','Silver'),('GOLD','Gold'),('PLATINUM','Platinum')],
        default='BRONZE'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def total_spent(self):
        from apps.orders.models import OrderLine
        result = (
            OrderLine.objects
            .filter(order__customer=self, order__status='PAID')
            .aggregate(total=Sum(F('unit_price') * F('quantity')))
        )
        return result['total'] or 0

    def recalculate_tier(self):
        spent = self.total_spent / 100
        if spent >= 5000:
            self.loyalty_tier = 'PLATINUM'
        elif spent >= 2000:
            self.loyalty_tier = 'GOLD'
        elif spent >= 500:
            self.loyalty_tier = 'SILVER'
        else:
            self.loyalty_tier = 'BRONZE'
        self.save(update_fields=['loyalty_tier'])


class LoyaltyTransaction(models.Model):
    TYPE_CHOICES = [
        ('EARN',   'Points Earned'),
        ('REDEEM', 'Points Redeemed'),
        ('ADJUST', 'Manual Adjustment'),
        ('EXPIRE', 'Points Expired'),
    ]
    customer   = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='loyalty_transactions')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES)
    points     = models.IntegerField()
    reference  = models.CharField(max_length=120, blank=True)
    note       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class GiftCard(models.Model):
    code           = models.CharField(max_length=20, unique=True)
    balance        = models.PositiveIntegerField(default=0)
    initial_amount = models.PositiveIntegerField(default=0)
    issued_to      = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='gift_cards')
    is_active      = models.BooleanField(default=True)
    expires_at     = models.DateField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Gift Card {self.code}'


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('PENDING',   'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('SEATED',    'Seated'),
        ('COMPLETED', 'Completed'),
        ('NO_SHOW',   'No Show'),
        ('CANCELLED', 'Cancelled'),
    ]
    customer         = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    guest_name       = models.CharField(max_length=120)
    guest_phone      = models.CharField(max_length=30, blank=True)
    guest_email      = models.EmailField(blank=True)
    party_size       = models.PositiveIntegerField(default=2)
    date             = models.DateField()
    time             = models.TimeField()
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    table            = models.ForeignKey('tables.RestaurantTable', on_delete=models.SET_NULL, null=True, blank=True)
    special_requests = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f'{self.guest_name} — {self.date} {self.time}'
