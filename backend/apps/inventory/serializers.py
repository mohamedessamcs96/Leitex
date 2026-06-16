from rest_framework import serializers
from .models import Ingredient, RecipeItem

class IngredientSerializer(serializers.ModelSerializer):
    is_low = serializers.BooleanField(read_only=True)
    class Meta:
        model = Ingredient
        fields = ['id','name','unit','stock','low_stock_at','cost_per_unit','supplier','is_low','updated_at']
        read_only_fields = ['id','updated_at']

class RecipeItemSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    class Meta:
        model = RecipeItem
        fields = ['id','menu_item','ingredient','ingredient_name','quantity']
