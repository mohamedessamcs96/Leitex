from django.db.models import Sum, F, Count, Value
from django.db.models.functions import Coalesce, ExtractHour
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.orders.models import Order, OrderLine, Payment


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now   = timezone.now()
        today = now.date()

        # ── Resolve report date range ──────────────────────────
        range_param = request.query_params.get('range', 'today')
        start_param = request.query_params.get('start')
        end_param   = request.query_params.get('end')

        if range_param == 'custom' and start_param and end_param:
            start_date = datetime.strptime(start_param, '%Y-%m-%d').date()
            end_date   = datetime.strptime(end_param, '%Y-%m-%d').date()
        elif range_param == 'week':
            start_date = today - timedelta(days=6)
            end_date   = today
        elif range_param == 'month':
            start_date = today.replace(day=1)
            end_date   = today
        else:
            range_param = 'today'
            start_date  = today
            end_date    = today

        paid_orders = Order.objects.filter(status='PAID', closed_at__date__range=(start_date, end_date))
        paid_lines  = OrderLine.objects.filter(order__in=paid_orders)

        # ── Summary ─────────────────────────────────────────────
        gross_revenue = paid_lines.aggregate(total=Sum(F('unit_price') * F('quantity')))['total'] or 0
        order_count   = paid_orders.count()
        total_discount = paid_orders.aggregate(total=Sum('discount'))['total'] or 0
        net_revenue   = max(0, gross_revenue - total_discount)
        avg_order_value = round(net_revenue / order_count) if order_count else 0
        items_sold    = paid_lines.aggregate(total=Sum('quantity'))['total'] or 0

        voided_orders = Order.objects.filter(status='VOIDED', updated_at__date__range=(start_date, end_date))
        voided_count  = voided_orders.count()
        voided_value  = (
            OrderLine.objects.filter(order__in=voided_orders)
            .aggregate(total=Sum(F('unit_price') * F('quantity')))['total'] or 0
        )

        # ── Payment method breakdown ───────────────────────────
        payment_methods = list(
            Payment.objects.filter(order__in=paid_orders)
            .values('method')
            .annotate(amount=Sum('amount'), count=Count('id'))
            .order_by('-amount')
        )

        # ── Revenue by menu category ───────────────────────────
        by_category = list(
            paid_lines.exclude(menu_item__isnull=True)
            .values('menu_item__category__name', 'menu_item__category__color')
            .annotate(revenue=Sum(F('unit_price') * F('quantity')), qty=Sum('quantity'))
            .order_by('-revenue')
        )
        by_category = [
            {'name': c['menu_item__category__name'], 'color': c['menu_item__category__color'],
             'revenue': c['revenue'], 'qty': c['qty']}
            for c in by_category
        ]

        # ── Revenue by staff member ────────────────────────────
        by_staff = list(
            paid_orders
            .annotate(staff_name=Coalesce('staff__name', Value('Unassigned')))
            .values('staff_name')
            .annotate(
                revenue=Sum(F('lines__unit_price') * F('lines__quantity')),
                order_count=Count('id', distinct=True),
            )
            .order_by('-revenue')
        )

        # ── Revenue by hour of day ──────────────────────────────
        hourly = (
            paid_lines.annotate(hour=ExtractHour('order__closed_at'))
            .values('hour')
            .annotate(revenue=Sum(F('unit_price') * F('quantity')))
        )
        hourly_map = {h['hour']: h['revenue'] for h in hourly}
        by_hour = [{'hour': h, 'revenue': hourly_map.get(h, 0)} for h in range(24)]

        # ── Top items for the selected range ───────────────────
        top_items = list(
            paid_lines.values('name')
            .annotate(total_qty=Sum('quantity'), total_revenue=Sum(F('unit_price') * F('quantity')))
            .order_by('-total_revenue')[:10]
        )

        # ── Backward-compatible blocks (today / current week) ──
        today_orders = Order.objects.filter(status='PAID', closed_at__date=today)
        today_revenue = (
            OrderLine.objects.filter(order__in=today_orders)
            .aggregate(total=Sum(F('unit_price') * F('quantity')))['total'] or 0
        )

        week_start = today - timedelta(days=today.weekday())
        week_data = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            rev = (
                OrderLine.objects
                .filter(order__status='PAID', order__closed_at__date=day)
                .aggregate(total=Sum(F('unit_price') * F('quantity')))['total'] or 0
            )
            week_data.append({'day': day.strftime('%a'), 'date': str(day), 'revenue': rev})

        from apps.tables.models import RestaurantTable
        open_count = RestaurantTable.objects.filter(status='OCCUPIED').count()

        return Response({
            'range': {'start': str(start_date), 'end': str(end_date), 'label': range_param},
            'summary': {
                'revenue':         net_revenue,
                'gross_revenue':   gross_revenue,
                'order_count':     order_count,
                'avg_order_value': avg_order_value,
                'items_sold':      items_sold,
                'total_discount':  total_discount,
                'voided_count':    voided_count,
                'voided_value':    voided_value,
            },
            'payment_methods': payment_methods,
            'by_category':     by_category,
            'by_staff':        by_staff,
            'by_hour':         by_hour,
            'top_items':       top_items,
            'open_tables':     open_count,
            'today':       {'revenue': today_revenue, 'order_count': today_orders.count()},
            'week':        week_data,
        })
