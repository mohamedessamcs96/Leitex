from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ingredient, RecipeItem
from .serializers import IngredientSerializer, RecipeItemSerializer

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'supplier']

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        items = [i for i in self.get_queryset() if i.is_low]
        return Response(IngredientSerializer(items, many=True).data)

class RecipeItemViewSet(viewsets.ModelViewSet):
    queryset = RecipeItem.objects.select_related('menu_item','ingredient')
    serializer_class = RecipeItemSerializer
    filterset_fields = ['menu_item']
    permission_classes = [permissions.IsAuthenticated]
