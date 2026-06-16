from django.db import models
from apps.staff.models import StaffMember
from apps.tables.models import RestaurantTable
from apps.menu.models import MenuItem


class Order(models.Model):
    STATUS_CHOICES = [('OPEN','Open'),('SENT','Sent to Kitchen'),('READY','Ready'),('PAID','Paid'),('VOIDED','Voided')]
    TYPE_CHOICES   = [('DINE_IN','Dine In'),('TAKEAWAY','Takeaway'),('DELIVERY','Delivery')]

    table      = models.ForeignKey(RestaurantTable, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    staff      = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, related_name='orders')
    customer   = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='DINE_IN')
    discount   = models.PositiveIntegerField(default=0)
    notes      = models.TextField(blank=True)
    course     = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id}'

    @property
    def subtotal(self):
        return sum(l.line_total for l in self.lines.all())

    @property
    def total(self):
        return max(0, self.subtotal - self.discount)


class OrderLine(models.Model):
    KDS_STATUS = [('PENDING','Pending'),('COOKING','Cooking'),('READY','Ready'),('SERVED','Served')]

    order       = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='lines')
    menu_item   = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, related_name='order_lines')
    name        = models.CharField(max_length=120)
    quantity    = models.PositiveIntegerField(default=1)
    unit_price  = models.PositiveIntegerField()
    mod_options = models.JSONField(default=list, blank=True)
    note        = models.TextField(blank=True)
    kds_status  = models.CharField(max_length=20, choices=KDS_STATUS, default='PENDING')
    station     = models.CharField(max_length=20, default='kitchen')
    course      = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['course','id']

    @property
    def line_total(self):
        return self.unit_price * self.quantity


class Payment(models.Model):
    METHOD_CHOICES = [('CASH','Cash'),('CARD','Card'),('SPLIT','Split'),('VOUCHER','Voucher'),('GIFT_CARD','Gift Card'),('LOYALTY','Loyalty Points')]

    order      = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    method     = models.CharField(max_length=20, choices=METHOD_CHOICES)
    amount     = models.PositiveIntegerField()
    reference  = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ClockEntry(models.Model):
    staff       = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name='clock_entries')
    clocked_in  = models.DateTimeField()
    clocked_out = models.DateTimeField(null=True, blank=True)
    notes       = models.TextField(blank=True)

    class Meta:
        ordering = ['-clocked_in']

    @property
    def duration_minutes(self):
        if self.clocked_out:
            return int((self.clocked_out - self.clocked_in).total_seconds() / 60)
        return None
