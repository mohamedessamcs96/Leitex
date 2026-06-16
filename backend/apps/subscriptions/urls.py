from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, OrganizationSubscriptionViewSet, AddOnViewSet

router = DefaultRouter()
router.register('plans',   SubscriptionPlanViewSet,        basename='plan')
router.register('orgs',    OrganizationSubscriptionViewSet, basename='org-subscription')
router.register('addons',  AddOnViewSet,                   basename='addon')
urlpatterns = [path('', include(router.urls))]
