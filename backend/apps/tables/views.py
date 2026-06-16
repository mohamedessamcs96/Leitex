from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RestaurantTable
from .serializers import TableSerializer, TableStatusUpdateSerializer

class TableViewSet(viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.filter(is_active=True)
    serializer_class = TableSerializer
    filterset_fields = ['status', 'zone']
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['patch'], url_path='set-status')
    def set_status(self, request, pk=None):
        table = self.get_object()
        ser = TableStatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        table.status = ser.validated_data['status']
        table.save(update_fields=['status'])
        return Response(TableSerializer(table).data)

    def perform_destroy(self, instance):
        # Soft-delete so historical orders keep their table reference
        instance.is_active = False
        instance.save(update_fields=['is_active'])
