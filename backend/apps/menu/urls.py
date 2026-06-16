from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MenuItemViewSet, ModifierGroupViewSet, ModifierOptionViewSet

router = DefaultRouter()
router.register('categories',        CategoryViewSet,       basename='category')
router.register('items',             MenuItemViewSet,       basename='menuitem')
router.register('modifier-groups',   ModifierGroupViewSet,  basename='modifiergroup')
router.register('modifier-options',  ModifierOptionViewSet, basename='modifieroption')

urlpatterns = [path('', include(router.urls))]
