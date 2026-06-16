from rest_framework import serializers
from .models import Category, MenuItem, ModifierGroup, ModifierOption


class ModifierOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ModifierOption
        fields = ['id', 'label', 'price_adj', 'sort_order']


class ModifierGroupSerializer(serializers.ModelSerializer):
    options = ModifierOptionSerializer(many=True, read_only=True)

    class Meta:
        model  = ModifierGroup
        fields = ['id', 'name', 'required', 'max_select', 'sort_order', 'options']


class MenuItemSerializer(serializers.ModelSerializer):
    modifier_groups = ModifierGroupSerializer(many=True, read_only=True)
    category_name   = serializers.CharField(source='category.name', read_only=True)
    price_display   = serializers.SerializerMethodField()

    class Meta:
        model  = MenuItem
        fields = [
            'id', 'category', 'category_name', 'name', 'description',
            'price', 'price_display', 'tax_rate', 'station',
            'is_available', 'sort_order', 'image', 'modifier_groups',
        ]

    def get_price_display(self, obj):
        return f'€{obj.price / 100:.2f}'


class MenuItemListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = MenuItem
        fields = ['id', 'category', 'category_name', 'name', 'price', 'station', 'is_available']


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemListSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model  = Category
        fields = ['id', 'name', 'color', 'sort_order', 'is_active', 'item_count', 'items']
