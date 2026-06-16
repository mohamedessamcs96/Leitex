from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Order, OrderLine, Payment, ClockEntry
from .serializers import (
    OrderSerializer, CreateOrderSerializer, AddLineSerializer,
    KDSStatusSerializer, ProcessPaymentSerializer, OrderLineSerializer,
    ClockEntrySerializer,
)
from apps.tables.models import RestaurantTable


def broadcast(event_type: str, data: dict):
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "pos_updates",
            {"type": "pos.message", "event": event_type, "data": data}
        )
    except Exception:
        pass


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("table","staff","customer").prefetch_related("lines","payments")
    serializer_class   = OrderSerializer
    filterset_fields   = ["status","table","staff","type"]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("active"):
            qs = qs.filter(status__in=["OPEN","SENT","READY"])
        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        ser = CreateOrderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        table = RestaurantTable.objects.get(pk=d["table_id"]) if d.get("table_id") else None
        customer = None
        if d.get("customer_id"):
            try:
                from apps.customers.models import Customer
                customer = Customer.objects.get(pk=d["customer_id"])
            except Exception:
                pass
        order = Order.objects.create(
            table=table, staff=request.user, customer=customer,
            discount=d["discount"], notes=d["notes"],
            type=d.get("type","DINE_IN"), status="SENT",
        )
        for ld in d["lines"]:
            OrderLine.objects.create(
                order=order, menu_item_id=ld["menu_item_id"],
                name=ld["name"], quantity=ld["quantity"],
                unit_price=ld["unit_price"], mod_options=ld["mod_options"],
                note=ld["note"], station=ld["station"],
                course=ld.get("course", 1), kds_status="PENDING",
            )
        if table:
            table.status = "OCCUPIED"
            table.save(update_fields=["status"])
        if customer:
            points = order.total // 100
            if points > 0:
                customer.loyalty_points += points
                customer.save(update_fields=["loyalty_points"])
                customer.recalculate_tier()
                from apps.customers.models import LoyaltyTransaction
                LoyaltyTransaction.objects.create(
                    customer=customer, type="EARN", points=points,
                    reference=f"Order #{order.id}"
                )
        data = OrderSerializer(order).data
        broadcast("order.created", data)
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="add-line")
    @transaction.atomic
    def add_line(self, request, pk=None):
        order = self.get_object()
        if order.status == "PAID":
            return Response({"detail": "Already paid."}, status=400)
        ser = AddLineSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        line = OrderLine.objects.create(
            order=order, menu_item_id=d["menu_item_id"],
            name=d["name"], quantity=d["quantity"],
            unit_price=d["unit_price"], mod_options=d["mod_options"],
            note=d["note"], station=d["station"], course=d.get("course",1),
        )
        broadcast("order.updated", OrderSerializer(order).data)
        return Response(OrderLineSerializer(line).data, status=201)

    @action(detail=True, methods=["delete"], url_path="lines/(?P<line_id>[0-9]+)")
    def remove_line(self, request, pk=None, line_id=None):
        order = self.get_object()
        try:
            order.lines.get(pk=line_id).delete()
        except OrderLine.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        broadcast("order.updated", OrderSerializer(order).data)
        return Response(status=204)

    @action(detail=True, methods=["patch"], url_path="lines/(?P<line_id>[0-9]+)/kds-status")
    def update_kds_status(self, request, pk=None, line_id=None):
        order = self.get_object()
        try:
            line = order.lines.get(pk=line_id)
        except OrderLine.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        ser = KDSStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        line.kds_status = ser.validated_data["kds_status"]
        line.save(update_fields=["kds_status"])
        all_lines = list(order.lines.all())
        if all(l.kds_status == "READY" for l in all_lines):
            order.status = "READY"
            order.save(update_fields=["status"])
        elif all(l.kds_status == "SERVED" for l in all_lines):
            order.status = "PAID"
            order.closed_at = timezone.now()
            order.save(update_fields=["status","closed_at"])
        data = OrderSerializer(order).data
        broadcast("kds.updated", data)
        return Response(data)

    @action(detail=True, methods=["post"], url_path="pay")
    @transaction.atomic
    def pay(self, request, pk=None):
        order = self.get_object()
        if order.status == "PAID":
            return Response({"detail": "Already paid."}, status=400)
        ser = ProcessPaymentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        Payment.objects.create(order=order, method=d["method"], amount=d["amount"], reference=d["reference"])
        order.status = "PAID"
        order.closed_at = timezone.now()
        order.save(update_fields=["status","closed_at"])
        if order.table:
            order.table.status = "FREE"
            order.table.save(update_fields=["status"])
        data = OrderSerializer(order).data
        broadcast("order.paid", data)
        return Response(data)

    @action(detail=True, methods=["post"], url_path="void")
    def void_order(self, request, pk=None):
        order = self.get_object()
        if order.status == "PAID":
            return Response({"detail": "Cannot void paid."}, status=400)
        order.status = "VOIDED"
        order.closed_at = timezone.now()
        order.save(update_fields=["status","closed_at"])
        if order.table:
            order.table.status = "FREE"
            order.table.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["patch"], url_path="set-discount")
    def set_discount(self, request, pk=None):
        order = self.get_object()
        order.discount = max(0, int(request.data.get("discount", 0)))
        order.save(update_fields=["discount"])
        return Response(OrderSerializer(order).data)


class ClockEntryViewSet(viewsets.ModelViewSet):
    queryset           = ClockEntry.objects.select_related("staff")
    serializer_class   = ClockEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields   = ["staff"]

    @action(detail=False, methods=["post"], url_path="clock-in")
    def clock_in(self, request):
        ClockEntry.objects.filter(staff=request.user, clocked_out__isnull=True).update(clocked_out=timezone.now())
        entry = ClockEntry.objects.create(staff=request.user, clocked_in=timezone.now())
        return Response(ClockEntrySerializer(entry).data, status=201)

    @action(detail=False, methods=["post"], url_path="clock-out")
    def clock_out(self, request):
        entry = ClockEntry.objects.filter(staff=request.user, clocked_out__isnull=True).last()
        if not entry:
            return Response({"detail": "Not clocked in."}, status=400)
        entry.clocked_out = timezone.now()
        entry.save(update_fields=["clocked_out"])
        return Response(ClockEntrySerializer(entry).data)

    @action(detail=False, methods=["get"], url_path="my-hours")
    def my_hours(self, request):
        entries = ClockEntry.objects.filter(staff=request.user).order_by("-clocked_in")[:30]
        return Response(ClockEntrySerializer(entries, many=True).data)
