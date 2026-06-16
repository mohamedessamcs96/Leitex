from datetime import time as dtime
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.staff.models import StaffMember
from apps.menu.models import Category, MenuItem, ModifierGroup, ModifierOption
from apps.tables.models import RestaurantTable
from apps.inventory.models import Ingredient
from apps.customers.models import Customer, Reservation
from apps.locations.models import Location
from apps.subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed demo data for LightPOS'

    def handle(self, *args, **options):
        self.stdout.write('Seeding LightPOS demo data...')

        # ── Staff ──────────────────────────────────────────────
        for username, name, role, pin in [
            ('james', 'James Laurent',  'MANAGER', '1234'),
            ('sofia', 'Sofia Reyes',    'CASHIER',  '2222'),
            ('marco', 'Marco Ferretti', 'WAITER',   '3333'),
            ('anna',  'Anna Kovacs',    'WAITER',   '4444'),
            ('chen',  'Chen Wei',       'KITCHEN',  '5555'),
        ]:
            if not StaffMember.objects.filter(username=username).exists():
                StaffMember.objects.create_user(username=username, name=name, role=role, pin=pin, password=pin)

        if not StaffMember.objects.filter(username='admin').exists():
            StaffMember.objects.create_superuser(username='admin', name='Admin', pin='0000', password='admin123')
        self.stdout.write(self.style.SUCCESS('  Staff OK'))

        # ── Location ──────────────────────────────────────────
        Location.objects.get_or_create(
            name='Main Restaurant',
            defaults={'address': '123 Via Roma', 'city': 'Berlin', 'country': 'DE', 'is_main': True, 'currency': 'EUR'}
        )

        # ── Subscription Plans ────────────────────────────────
        plan_data = [
            ('Starter',    'STARTER',    49,  490,  1,   1,   3,   False, False, False),
            ('Essential',  'ESSENTIAL',  99,  990,  3,   2,   10,  True,  True,  False),
            ('Premium',    'PREMIUM',    199, 1990, 10,  5,   25,  True,  True,  True),
            ('Enterprise', 'ENTERPRISE', 399, 3990, 999, 999, 999, True,  True,  True),
        ]
        plan_features = {
            'STARTER':    ['POS ordering', 'Cash & card payments', 'Basic reports', '1 register', '3 staff accounts'],
            'ESSENTIAL':  ['All Starter features', 'Kitchen Display System', 'Inventory tracking', 'Customer profiles', '2 locations'],
            'PREMIUM':    ['All Essential features', 'Loyalty & CRM', 'Delivery integrations', 'Online ordering', 'QR self-ordering', '5 locations'],
            'ENTERPRISE': ['All Premium features', 'AI-powered insights', 'Open API access', 'Unlimited locations', 'Custom onboarding'],
        }
        for name, tier, pm, py, regs, locs, staff_n, kds, analytics, ai in plan_data:
            SubscriptionPlan.objects.get_or_create(tier=tier, defaults={
                'name': name, 'price_monthly': pm, 'price_yearly': py,
                'max_registers': regs, 'max_locations': locs, 'max_staff': staff_n,
                'has_kds': kds, 'has_analytics': analytics, 'has_ai': ai,
                'has_loyalty': analytics, 'has_delivery': analytics, 'has_api': ai,
                'sort_order': ['STARTER', 'ESSENTIAL', 'PREMIUM', 'ENTERPRISE'].index(tier),
                'features': plan_features[tier],
            })
        self.stdout.write(self.style.SUCCESS('  Subscription plans OK'))

        # ── Menu ──────────────────────────────────────────────
        cats = {}
        for name, color, order in [
            ('Starters', '#14b8a6', 1), ('Mains', '#3b82f6', 2),
            ('Desserts', '#a855f7', 3), ('Drinks', '#f59e0b', 4),
            ('Coffee', '#e8612c', 5),   ('Specials', '#ef4444', 6),
        ]:
            cats[name], _ = Category.objects.get_or_create(name=name, defaults={'color': color, 'sort_order': order})

        menu_items = [
            ('Bruschetta al Pomodoro', 'Grilled sourdough, heirloom tomato, basil oil', 850,  'Starters', 'kitchen'),
            ('Burrata & Prosciutto',   'Creamy burrata, San Daniele, grilled peach',    1400, 'Starters', 'kitchen'),
            ('Caesar Salad',           'Romaine, anchovy dressing, parmesan crisp',     1100, 'Starters', 'kitchen'),
            ('French Onion Soup',      'Caramelised onion, gruyere crouton',            1200, 'Starters', 'kitchen'),
            ('Dry-Aged Beef Burger',   '200g aged patty, aged cheddar, house pickles',  1850, 'Mains',    'kitchen'),
            ('Pasta Carbonara',        'Rigatoni, guanciale, egg yolk, pecorino',       1600, 'Mains',    'kitchen'),
            ('Pan-Seared Salmon',      'Atlantic salmon, lemon beurre blanc, capers',   2400, 'Mains',    'kitchen'),
            ('Margherita Pizza',       'San Marzano, fior di latte, fresh basil',       1400, 'Mains',    'kitchen'),
            ('Risotto ai Funghi',      'Wild mushroom, truffle, aged parmesan',         1750, 'Mains',    'kitchen'),
            ('Grilled Ribeye 300g',    'Prime ribeye, chimichurri, bone marrow',        3800, 'Mains',    'kitchen'),
            ('Tiramisu',               'Mascarpone, espresso-soaked savoiardi',         850,  'Desserts', 'kitchen'),
            ('Panna Cotta',            'Vanilla bean, mixed berry coulis',              750,  'Desserts', 'kitchen'),
            ('Lava Cake',              'Dark chocolate fondant, vanilla ice cream',     900,  'Desserts', 'kitchen'),
            ('House Red - Barolo',     'Nebbiolo, Piedmont, Italy 2019',                850,  'Drinks',   'bar'),
            ('House White - Chablis',  'Chardonnay, Burgundy, France 2021',             800,  'Drinks',   'bar'),
            ('San Pellegrino 500ml',   'Sparkling mineral water',                       380,  'Drinks',   'bar'),
            ('Craft Lager - Peroni',   'Chilled Italian lager 330ml',                  550,  'Drinks',   'bar'),
            ('Fresh Orange Juice',     'Cold-pressed, served fresh',                    480,  'Drinks',   'bar'),
            ('Espresso',               'Double shot, origin blend',                     280,  'Coffee',   'bar'),
            ('Flat White',             'Double ristretto, steamed whole milk',          380,  'Coffee',   'bar'),
            ('Cappuccino',             'Espresso, steamed milk, foam',                  380,  'Coffee',   'bar'),
            ('Americano',              'Double espresso, hot water',                    320,  'Coffee',   'bar'),
            ("Chef's Tasting Menu",    '5 courses, paired wines available',             8500, 'Specials', 'kitchen'),
            ('Lobster Bisque',         'Brandy cream, chive oil - daily special',       2200, 'Specials', 'kitchen'),
        ]
        item_map = {}
        for name, desc, price, cat, station in menu_items:
            item, _ = MenuItem.objects.get_or_create(
                name=name,
                defaults={'description': desc, 'price': price, 'category': cats[cat], 'station': station}
            )
            item_map[name] = item

        # Modifiers
        burger = item_map.get('Dry-Aged Beef Burger')
        if burger and not burger.modifier_groups.exists():
            g1 = ModifierGroup.objects.create(menu_item=burger, name='Doneness', required=True)
            for lb in ['Rare', 'Medium Rare', 'Medium', 'Well Done']:
                ModifierOption.objects.create(group=g1, label=lb, price_adj=0)
            g2 = ModifierGroup.objects.create(menu_item=burger, name='Add-ons', required=False)
            for lb, adj in [('Extra Bacon', 200), ('Truffle Mayo', 150), ('Avocado', 200)]:
                ModifierOption.objects.create(group=g2, label=lb, price_adj=adj)

        espresso = item_map.get('Espresso')
        if espresso and not espresso.modifier_groups.exists():
            g = ModifierGroup.objects.create(menu_item=espresso, name='Milk', required=False)
            for lb in ['Oat Milk', 'Almond Milk', 'Soy Milk']:
                ModifierOption.objects.create(group=g, label=lb, price_adj=50)

        self.stdout.write(self.style.SUCCESS(f'  {len(menu_items)} menu items OK'))

        # ── Tables ────────────────────────────────────────────
        tables = [
            ('T1',  2, 80,  60,  'Main'), ('T2',  4, 220, 60,  'Main'),
            ('T3',  4, 380, 60,  'Main'), ('T4',  6, 560, 60,  'Main'),
            ('T5',  4, 80,  220, 'Main'), ('T6',  4, 260, 220, 'Main'),
            ('T7',  2, 420, 220, 'Main'), ('T8',  6, 580, 220, 'Main'),
            ('T9',  4, 100, 380, 'Main'), ('T10', 4, 300, 380, 'Main'),
            ('T11', 2, 480, 380, 'Main'), ('B1',  2, 660, 380, 'Bar'),
        ]
        for label, seats, x, y, zone in tables:
            RestaurantTable.objects.get_or_create(
                label=label, defaults={'seats': seats, 'pos_x': x, 'pos_y': y, 'zone': zone}
            )
        self.stdout.write(self.style.SUCCESS(f'  {len(tables)} tables OK'))

        # ── Inventory ─────────────────────────────────────────
        for name, unit, stock, low, cost, supplier in [
            ('Beef Patties',        'pcs', 24,  10, 3.20,  'Metro Cash & Carry'),
            ('Atlantic Salmon',     'kg',  4.2,  2, 18.00, 'FreshSea Direct'),
            ('Rigatoni Pasta',      'kg',  12.5, 5, 1.40,  'Italian Imports'),
            ('Barolo Wine',         'btl', 8,    6, 22.00, 'Vinoteca'),
            ('Heavy Cream',         'l',   3.5,  2, 1.80,  'Dairy Fresh'),
            ('Parmesan DOP',        'kg',  2.1,  1, 24.00, 'Italian Imports'),
            ('San Marzano Tomato',  'can', 42,  20, 2.10,  'Metro Cash & Carry'),
            ('Espresso Blend',      'kg',  5.8,  3, 16.50, 'CoffeeRoast Co.'),
            ('Ribeye Steak',        'kg',  6.4,  3, 38.00, 'Prime Meats'),
            ('Mascarpone',          'kg',  1.2,  2, 8.00,  'Dairy Fresh'),
        ]:
            Ingredient.objects.get_or_create(
                name=name,
                defaults={'unit': unit, 'stock': stock, 'low_stock_at': low, 'cost_per_unit': cost, 'supplier': supplier}
            )
        self.stdout.write(self.style.SUCCESS('  Inventory OK'))

        # ── Demo Customers ────────────────────────────────────
        for fn, ln, email, phone, tier, points in [
            ('Emma',   'Rossi',   'emma.rossi@email.com',  '+49 170 1234567', 'GOLD',     1240),
            ('Luca',   'Bianchi', 'luca.b@email.com',      '+49 152 9876543', 'SILVER',   380),
            ('Sophie', 'Mueller', 'sophie.m@email.com',    '+49 163 4567890', 'BRONZE',   80),
            ('Carlos', 'Ruiz',    'carlos.r@email.com',    '+49 174 3216540', 'PLATINUM', 5200),
            ('Yuki',   'Tanaka',  'yuki.t@email.com',      '+49 160 1112223', 'SILVER',   620),
        ]:
            Customer.objects.get_or_create(
                email=email,
                defaults={'first_name': fn, 'last_name': ln, 'phone': phone, 'loyalty_tier': tier, 'loyalty_points': points}
            )
        self.stdout.write(self.style.SUCCESS('  Customers OK'))

        # ── Demo Reservations ─────────────────────────────────
        tomorrow = (timezone.now() + timedelta(days=1)).date()
        for name, phone, size, time_str, res_status, req in [
            ('Emma Rossi',        '+49 170 1234567', 4, '19:00', 'CONFIRMED', 'Window seat please'),
            ('Luca Bianchi',      '+49 152 9876543', 2, '20:30', 'PENDING',   'Anniversary dinner'),
            ('Corporate Booking', '+49 30 9999000',  8, '13:00', 'CONFIRMED', 'Business lunch'),
        ]:
            h, m = map(int, time_str.split(':'))
            Reservation.objects.get_or_create(
                guest_name=name, date=tomorrow,
                defaults={
                    'guest_phone': phone, 'party_size': size,
                    'time': dtime(h, m), 'status': res_status,
                    'special_requests': req,
                }
            )
        self.stdout.write(self.style.SUCCESS('  Reservations OK'))

        self.stdout.write(self.style.SUCCESS('\nLightPOS seeded successfully!'))
        self.stdout.write('  Admin login: admin / admin123')
        self.stdout.write('  Staff PINs:  1234 | 2222 | 3333 | 4444 | 5555')
