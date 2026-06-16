from django.db import models
from apps.menu.models import MenuItem


class Ingredient(models.Model):
    name       = models.CharField(max_length=100)
    unit       = models.CharField(max_length=20)  # g, ml, pcs, kg, l
    stock      = models.FloatField(default=0)
    low_stock_at = models.FloatField(default=0)
    cost_per_unit = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    supplier   = models.CharField(max_length=120, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.stock} {self.unit})'

    @property
    def is_low(self):
        return self.stock <= self.low_stock_at


class RecipeItem(models.Model):
    menu_item  = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='recipe_items')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='recipe_items')
    quantity   = models.FloatField()

    class Meta:
        unique_together = ['menu_item', 'ingredient']

    def __str__(self):
        return f'{self.menu_item.name} uses {self.quantity}{self.ingredient.unit} {self.ingredient.name}'
