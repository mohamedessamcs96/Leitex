from django.db import models


class RestaurantTable(models.Model):
    STATUS_CHOICES = [
        ('FREE',     'Available'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('BILL',     'Awaiting Bill'),
    ]

    label      = models.CharField(max_length=20)
    seats      = models.PositiveIntegerField(default=4)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='FREE')
    zone       = models.CharField(max_length=80, blank=True, default='Main')
    pos_x      = models.FloatField(default=0)
    pos_y      = models.FloatField(default=0)
    is_active  = models.BooleanField(default=True)

    class Meta:
        ordering = ['label']

    def __str__(self):
        return f'Table {self.label} ({self.status})'
