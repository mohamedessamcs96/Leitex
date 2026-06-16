from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, LocationStaffViewSet

router = DefaultRouter()
router.register('branches', LocationViewSet, basename='location')
router.register('staff-assignments', LocationStaffViewSet, basename='location-staff')
urlpatterns = [path('', include(router.urls))]
