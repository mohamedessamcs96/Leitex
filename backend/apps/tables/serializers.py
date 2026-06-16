from rest_framework import serializers, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RestaurantTable


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RestaurantTable
        fields = ['id', 'label', 'seats', 'status', 'zone', 'pos_x', 'pos_y', 'is_active']


class TableStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['FREE', 'OCCUPIED', 'RESERVED', 'BILL'])


class TableViewSet(viewsets.ModelViewSet):
    queryset           = RestaurantTable.objects.filter(is_active=True)
    serializer_class   = TableSerializer
    filterset_fields   = ['status', 'zone']
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['patch'], url_path='set-status')
    def set_status(self, request, pk=None):
        table  = self.get_object()
        ser    = TableStatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        table.status = ser.validated_data['status']
        table.save(update_fields=['status'])
        return Response(TableSerializer(table).data)
