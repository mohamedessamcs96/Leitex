from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, RecipeItemViewSet
router = DefaultRouter()
router.register('ingredients', IngredientViewSet, basename='ingredient')
router.register('recipes', RecipeItemViewSet, basename='recipe')
urlpatterns = [path('', include(router.urls))]
