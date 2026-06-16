from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer, LoyaltyTransaction, GiftCard, Reservation
from .serializers import (
    CustomerSerializer, LoyaltyTransactionSerializer,
    GiftCardSerializer, ReservationSerializer,
)
import random
import string


class CustomerViewSet(viewsets.ModelViewSet):
    queryset           = Customer.objects.all()
    serializer_class   = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields      = ['first_name', 'last_name', 'email', 'phone']
    filterset_fields   = ['loyalty_tier']

    @action(detail=True, methods=['post'], url_path='add-points')
    def add_points(self, request, pk=None):
        customer = self.get_object()
        points   = int(request.data.get('points', 0))
        note     = request.data.get('note', '')
        customer.loyalty_points += points
        customer.save(update_fields=['loyalty_points'])
        customer.recalculate_tier()
        LoyaltyTransaction.objects.create(
            customer=customer, type='EARN', points=points, note=note
        )
        return Response(CustomerSerializer(customer).data)

    @action(detail=True, methods=['post'], url_path='redeem-points')
    def redeem_points(self, request, pk=None):
        customer = self.get_object()
        points   = int(request.data.get('points', 0))
        if customer.loyalty_points < points:
            return Response({'detail': 'Insufficient points.'}, status=400)
        customer.loyalty_points -= points
        customer.save(update_fields=['loyalty_points'])
        LoyaltyTransaction.objects.create(
            customer=customer, type='REDEEM', points=-points
        )
        return Response(CustomerSerializer(customer).data)

    @action(detail=True, methods=['get'], url_path='order-history')
    def order_history(self, request, pk=None):
        customer = self.get_object()
        # Import here to avoid circular imports
        from apps.orders.models import Order
        from apps.orders.serializers import OrderSerializer
        orders = Order.objects.filter(customer=customer).order_by('-created_at')[:20]
        return Response(OrderSerializer(orders, many=True).data)


class LoyaltyTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = LoyaltyTransaction.objects.select_related('customer')
    serializer_class   = LoyaltyTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields   = ['customer', 'type']


class GiftCardViewSet(viewsets.ModelViewSet):
    queryset           = GiftCard.objects.all()
    serializer_class   = GiftCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
        serializer.save(code=code)

    @action(detail=False, methods=['post'], url_path='check')
    def check_balance(self, request):
        code = request.data.get('code', '')
        try:
            card = GiftCard.objects.get(code=code.upper(), is_active=True)
            return Response(GiftCardSerializer(card).data)
        except GiftCard.DoesNotExist:
            return Response({'detail': 'Invalid or inactive gift card.'}, status=404)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset           = Reservation.objects.select_related('customer', 'table')
    serializer_class   = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields   = ['date', 'status', 'table']

    @action(detail=True, methods=['patch'], url_path='set-status')
    def set_status(self, request, pk=None):
        reservation = self.get_object()
        new_status  = request.data.get('status')
        reservation.status = new_status
        reservation.save(update_fields=['status'])
        if new_status == 'SEATED' and reservation.table:
            reservation.table.status = 'OCCUPIED'
            reservation.table.save(update_fields=['status'])
        return Response(ReservationSerializer(reservation).data)
