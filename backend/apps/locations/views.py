from django.utils import timezone
from django.db.models import Sum, F
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Location, LocationStaff
from .serializers import LocationSerializer, LocationStaffSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset           = Location.objects.filter(is_active=True)
    serializer_class   = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='summary')
    def summary(self, request, pk=None):
        from apps.orders.models import OrderLine
        from apps.tables.models import RestaurantTable
        loc   = self.get_object()
        today = timezone.now().date()
        revenue = (
            OrderLine.objects
            .filter(order__status='PAID', order__closed_at__date=today)
            .aggregate(total=Sum(F('unit_price') * F('quantity')))['total'] or 0
        )
        open_tables = RestaurantTable.objects.filter(status='OCCUPIED').count()
        return Response({
            'location': loc.name, 'today_revenue': revenue, 'open_tables': open_tables
        })


class LocationStaffViewSet(viewsets.ModelViewSet):
    queryset           = LocationStaff.objects.select_related('location', 'staff')
    serializer_class   = LocationStaffSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields   = ['location', 'staff']
