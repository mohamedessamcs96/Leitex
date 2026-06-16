from django.db import models


class DeliveryZone(models.Model):
    name           = models.CharField(max_length=80)
    min_order      = models.PositiveIntegerField(default=0, help_text='Min order value in cents')
    delivery_fee   = models.PositiveIntegerField(default=0, help_text='Fee in cents')
    est_minutes    = models.PositiveIntegerField(default=30)
    is_active      = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class DeliveryOrder(models.Model):
    TYPE_CHOICES = [
        ('DINE_IN',   'Dine In'),
        ('TAKEAWAY',  'Takeaway'),
        ('DELIVERY',  'Delivery'),
    ]
    STATUS_CHOICES = [
        ('NEW',        'New'),
        ('ACCEPTED',   'Accepted'),
        ('PREPARING',  'Preparing'),
        ('READY',      'Ready for Pickup'),
        ('OUT',        'Out for Delivery'),
        ('DELIVERED',  'Delivered'),
        ('CANCELLED',  'Cancelled'),
    ]
    PLATFORM_CHOICES = [
        ('POS',       'In-Store POS'),
        ('ONLINE',    'Online Order'),
        ('UBER_EATS', 'Uber Eats'),
        ('DELIVEROO', 'Deliveroo'),
        ('JUST_EAT',  'Just Eat'),
        ('QR_CODE',   'QR Code Order'),
    ]

    order          = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='delivery_info', null=True, blank=True)
    type           = models.CharField(max_length=20, choices=TYPE_CHOICES, default='DINE_IN')
    platform       = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='POS')
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')

    # Delivery details
    customer_name  = models.CharField(max_length=120, blank=True)
    customer_phone = models.CharField(max_length=30, blank=True)
    address        = models.TextField(blank=True)
    zone           = models.ForeignKey(DeliveryZone, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_fee   = models.PositiveIntegerField(default=0)
    est_delivery   = models.DateTimeField(null=True, blank=True)

    # External platform reference
    external_id    = models.CharField(max_length=120, blank=True)
    platform_notes = models.TextField(blank=True)

    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_type_display()} — {self.customer_name or "Guest"}'


class QRTable(models.Model):
    """QR code self-ordering for each table."""
    table      = models.OneToOneField('tables.RestaurantTable', on_delete=models.CASCADE, related_name='qr_code')
    token      = models.CharField(max_length=64, unique=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'QR — Table {self.table.label}'
