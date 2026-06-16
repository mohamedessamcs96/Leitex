from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, MenuItem, ModifierGroup, ModifierOption
from .serializers import (
    CategorySerializer, MenuItemSerializer,
    MenuItemListSerializer, ModifierGroupSerializer, ModifierOptionSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset         = Category.objects.filter(is_active=True).prefetch_related('items')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='full-menu')
    def full_menu(self, request):
        """Return entire menu tree in one request for POS screen load."""
        categories = Category.objects.filter(is_active=True).prefetch_related(
            'items', 'items__modifier_groups', 'items__modifier_groups__options'
        )
        data = []
        for cat in categories:
            cat_data = CategorySerializer(cat).data
            data.append(cat_data)
        return Response(data)


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset           = MenuItem.objects.select_related('category').prefetch_related('modifier_groups__options')
    serializer_class   = MenuItemSerializer
    filterset_fields   = ['category', 'station', 'is_available']
    search_fields      = ['name', 'description']
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return MenuItemListSerializer
        return MenuItemSerializer

    @action(detail=True, methods=['patch'], url_path='toggle-availability')
    def toggle_availability(self, request, pk=None):
        item = self.get_object()
        item.is_available = not item.is_available
        item.save(update_fields=['is_available'])
        return Response({'is_available': item.is_available})


class ModifierGroupViewSet(viewsets.ModelViewSet):
    queryset           = ModifierGroup.objects.prefetch_related('options')
    serializer_class   = ModifierGroupSerializer
    filterset_fields   = ['menu_item']
    permission_classes = [permissions.IsAuthenticated]


class ModifierOptionViewSet(viewsets.ModelViewSet):
    queryset           = ModifierOption.objects.all()
    serializer_class   = ModifierOptionSerializer
    filterset_fields   = ['group']
    permission_classes = [permissions.IsAuthenticated]
