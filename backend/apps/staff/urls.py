from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, ShiftSessionViewSet

router = DefaultRouter()
router.register('members',  StaffViewSet,        basename='staff')
router.register('sessions', ShiftSessionViewSet, basename='shift-session')

urlpatterns = [path('', include(router.urls))]
