from django.db import models


class Location(models.Model):
    name        = models.CharField(max_length=120)
    address     = models.TextField(blank=True)
    city        = models.CharField(max_length=80, blank=True)
    country     = models.CharField(max_length=80, default='DE')
    phone       = models.CharField(max_length=30, blank=True)
    email       = models.EmailField(blank=True)
    timezone    = models.CharField(max_length=50, default='Europe/Berlin')
    currency    = models.CharField(max_length=10, default='EUR')
    is_active   = models.BooleanField(default=True)
    is_main     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    # Settings
    tax_rate         = models.DecimalField(max_digits=5, decimal_places=4, default=0.19)
    receipt_footer   = models.TextField(blank=True)
    open_time        = models.TimeField(null=True, blank=True)
    close_time       = models.TimeField(null=True, blank=True)
    covers_per_turn  = models.PositiveIntegerField(default=20)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class LocationStaff(models.Model):
    """Which staff members are assigned to which locations."""
    location   = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='staff_assignments')
    staff      = models.ForeignKey('staff.StaffMember', on_delete=models.CASCADE, related_name='location_assignments')
    is_manager = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['location','staff']
