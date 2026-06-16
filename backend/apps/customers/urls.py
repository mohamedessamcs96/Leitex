from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, LoyaltyTransactionViewSet, GiftCardViewSet, ReservationViewSet

router = DefaultRouter()
router.register('profiles',      CustomerViewSet,           basename='customer')
router.register('loyalty',       LoyaltyTransactionViewSet, basename='loyalty')
router.register('gift-cards',    GiftCardViewSet,           basename='giftcard')
router.register('reservations',  ReservationViewSet,        basename='reservation')
urlpatterns = [path('', include(router.urls))]
