from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SubscriptionPlan, OrganizationSubscription, AddOn
from .serializers import SubscriptionPlanSerializer, OrganizationSubscriptionSerializer, AddOnSerializer

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

class OrganizationSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = OrganizationSubscription.objects.prefetch_related('addons','plan')
    serializer_class = OrganizationSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='add-addon')
    def add_addon(self, request, pk=None):
        sub = self.get_object()
        ser = AddOnSerializer(data={**request.data, 'subscription': sub.id})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(OrganizationSubscriptionSerializer(sub).data)

class AddOnViewSet(viewsets.ModelViewSet):
    queryset = AddOn.objects.all()
    serializer_class = AddOnSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['subscription','type','active']
