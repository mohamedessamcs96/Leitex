from django.db import models


class Category(models.Model):
    name       = models.CharField(max_length=80)
    color      = models.CharField(max_length=20, default='#3b82f6')
    sort_order = models.PositiveIntegerField(default=0)
    is_active  = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    STATION_CHOICES = [
        ('kitchen', 'Kitchen'),
        ('bar',     'Bar'),
        ('any',     'Any'),
    ]

    category    = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name        = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price       = models.PositiveIntegerField(help_text='Price in cents (e.g. 1500 = €15.00)')
    tax_rate    = models.DecimalField(max_digits=5, decimal_places=4, default=0.19)
    station     = models.CharField(max_length=20, choices=STATION_CHOICES, default='kitchen')
    is_available = models.BooleanField(default=True)
    sort_order  = models.PositiveIntegerField(default=0)
    image       = models.ImageField(upload_to='menu/', null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class ModifierGroup(models.Model):
    menu_item  = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='modifier_groups')
    name       = models.CharField(max_length=80)
    required   = models.BooleanField(default=False)
    max_select = models.PositiveIntegerField(default=1)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.menu_item.name} — {self.name}'


class ModifierOption(models.Model):
    group      = models.ForeignKey(ModifierGroup, on_delete=models.CASCADE, related_name='options')
    label      = models.CharField(max_length=80)
    price_adj  = models.IntegerField(default=0, help_text='Price adjustment in cents')
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'label']

    def __str__(self):
        return f'{self.group.name}: {self.label}'
