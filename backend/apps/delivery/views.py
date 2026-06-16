import secrets
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DeliveryZone, DeliveryOrder, QRTable
from .serializers import DeliveryZoneSerializer, DeliveryOrderSerializer, QRTableSerializer

class DeliveryZoneViewSet(viewsets.ModelViewSet):
    queryset = DeliveryZone.objects.filter(is_active=True)
    serializer_class = DeliveryZoneSerializer
    permission_classes = [permissions.IsAuthenticated]

class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.select_related('order','zone')
    serializer_class = DeliveryOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['type','platform','status']

    @action(detail=True, methods=['patch'], url_path='advance-status')
    def advance_status(self, request, pk=None):
        flow = ['NEW','ACCEPTED','PREPARING','READY','OUT','DELIVERED']
        dorder = self.get_object()
        try:
            idx = flow.index(dorder.status)
            if idx < len(flow) - 1:
                dorder.status = flow[idx + 1]
                dorder.save(update_fields=['status'])
        except ValueError:
            pass
        return Response(DeliveryOrderSerializer(dorder).data)

class QRTableViewSet(viewsets.ModelViewSet):
    queryset = QRTable.objects.select_related('table')
    serializer_class = QRTableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(token=secrets.token_urlsafe(32))

    @action(detail=False, methods=['get'], url_path='by-token/(?P<token>[^/.]+)',
            permission_classes=[permissions.AllowAny])
    def by_token(self, request, token=None):
        try:
            qr = QRTable.objects.get(token=token, is_active=True)
            return Response(QRTableSerializer(qr).data)
        except QRTable.DoesNotExist:
            return Response({'detail': 'Invalid QR code.'}, status=404)
