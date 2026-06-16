from django.contrib import admin
from .models import Ingredient, RecipeItem

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['name','unit','stock','low_stock_at','supplier','is_low']
    search_fields = ['name']

@admin.register(RecipeItem)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['menu_item','ingredient','quantity']
