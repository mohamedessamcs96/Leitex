from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, ClockEntryViewSet

router = DefaultRouter()
router.register('', OrderViewSet, basename='order')
router.register('clock', ClockEntryViewSet, basename='clock')
urlpatterns = [path('', include(router.urls))]
