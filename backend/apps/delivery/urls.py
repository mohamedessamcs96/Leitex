from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryZoneViewSet, DeliveryOrderViewSet, QRTableViewSet

router = DefaultRouter()
router.register('zones',      DeliveryZoneViewSet,  basename='delivery-zone')
router.register('orders',     DeliveryOrderViewSet, basename='delivery-order')
router.register('qr-tables',  QRTableViewSet,       basename='qr-table')
urlpatterns = [path('', include(router.urls))]
