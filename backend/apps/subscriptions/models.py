from django.db import models
from django.utils import timezone


class SubscriptionPlan(models.Model):
    TIER_CHOICES = [
        ('STARTER',    'Starter'),
        ('ESSENTIAL',  'Essential'),
        ('PREMIUM',    'Premium'),
        ('ENTERPRISE', 'Enterprise'),
    ]
    name          = models.CharField(max_length=80)
    tier          = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2)  # per location/register
    price_yearly  = models.DecimalField(max_digits=8, decimal_places=2)
    description   = models.TextField(blank=True)
    features      = models.JSONField(default=list)   # list of feature strings
    max_registers = models.PositiveIntegerField(default=1)
    max_locations = models.PositiveIntegerField(default=1)
    max_staff     = models.PositiveIntegerField(default=5)
    has_kds       = models.BooleanField(default=False)
    has_analytics = models.BooleanField(default=False)
    has_loyalty   = models.BooleanField(default=False)
    has_delivery  = models.BooleanField(default=False)
    has_api       = models.BooleanField(default=False)
    has_ai        = models.BooleanField(default=False)
    is_active     = models.BooleanField(default=True)
    sort_order    = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.name} — €{self.price_monthly}/mo'


class OrganizationSubscription(models.Model):
    STATUS_CHOICES = [
        ('TRIAL',    'Trial'),
        ('ACTIVE',   'Active'),
        ('PAST_DUE', 'Past Due'),
        ('CANCELLED','Cancelled'),
        ('EXPIRED',  'Expired'),
    ]
    BILLING_CHOICES = [('MONTHLY','Monthly'),('YEARLY','Yearly')]

    plan           = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    org_name       = models.CharField(max_length=120)
    billing_email  = models.EmailField()
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TRIAL')
    billing_cycle  = models.CharField(max_length=20, choices=BILLING_CHOICES, default='MONTHLY')
    trial_ends_at  = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end   = models.DateTimeField(null=True, blank=True)
    seats          = models.PositiveIntegerField(default=1)  # number of locations
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.org_name} — {self.plan.name}'

    @property
    def monthly_total(self):
        return float(self.plan.price_monthly) * self.seats

    @property
    def is_trial(self):
        return self.status == 'TRIAL' and self.trial_ends_at and self.trial_ends_at > timezone.now()

    @property
    def days_remaining(self):
        if self.trial_ends_at:
            delta = self.trial_ends_at - timezone.now()
            return max(0, delta.days)
        return None


class AddOn(models.Model):
    ADDON_TYPES = [
        ('KDS',           'Kitchen Display System'),
        ('RESERVATIONS',  'Reservations Module'),
        ('DELIVERY',      'Delivery Integration'),
        ('LOYALTY',       'Loyalty & CRM'),
        ('EXTRA_REGISTER','Additional Register'),
        ('EXTRA_LOCATION','Additional Location'),
    ]
    type            = models.CharField(max_length=30, choices=ADDON_TYPES)
    subscription    = models.ForeignKey(OrganizationSubscription, on_delete=models.CASCADE, related_name='addons')
    quantity        = models.PositiveIntegerField(default=1)
    price_per_unit  = models.DecimalField(max_digits=6, decimal_places=2)
    active          = models.BooleanField(default=True)
    added_at        = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.get_type_display()} x{self.quantity}'
