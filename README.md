# LightPOS — Full-Stack Restaurant Management System

A production-grade POS system with Django REST API backend, Django Channels WebSocket for real-time updates, and React/TypeScript frontend.

---

## Quick Start (2 terminals)

### Requirements
- Python 3.10+
- Node.js 18+
- npm 9+

### Terminal 1 — Backend

**Mac/Linux:**
```bash
chmod +x start_backend.sh
./start_backend.sh
```

**Windows:**
```
start_backend.bat
```

**Manual:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed             # Creates demo data
python manage.py runserver
```

Backend runs at: **http://localhost:8000**
Admin panel: **http://localhost:8000/admin** → `admin` / `admin123`

---

### Terminal 2 — Frontend

**Mac/Linux:**
```bash
chmod +x start_frontend.sh
./start_frontend.sh
```

**Windows:**
```
start_frontend.bat
```

**Manual:**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Staff Login PINs

| Name            | Role     | PIN  |
|-----------------|----------|------|
| James Laurent   | Manager  | 1234 |
| Sofia Reyes     | Cashier  | 2222 |
| Marco Ferretti  | Waiter   | 3333 |
| Anna Kovacs     | Waiter   | 4444 |
| Chen Wei        | Kitchen  | 5555 |

---

## Architecture

```
lightpos_full/
├── backend/                    Django REST API
│   ├── lightpos/
│   │   ├── settings.py         Django config (SQLite dev, PostgreSQL prod)
│   │   ├── urls.py             URL routing
│   │   └── asgi.py             ASGI + WebSocket routing
│   ├── apps/
│   │   ├── staff/              Custom user model, PIN login, JWT auth
│   │   ├── menu/               Categories, items, modifier groups
│   │   ├── tables/             Floor plan, table status management
│   │   ├── orders/             Orders, lines, KDS status, payments
│   │   │   ├── consumers.py    WebSocket consumer (real-time updates)
│   │   │   └── routing.py      WS URL routing  ws://localhost:8000/ws/pos/
│   │   ├── inventory/          Ingredients, stock levels, low-stock alerts
│   │   └── analytics/          Revenue dashboard, top items
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                   React + TypeScript + Vite
│   └── src/
│       ├── api.ts              All API calls + WebSocket client
│       ├── store.ts            Zustand global state (wired to API)
│       ├── types.ts            TypeScript types
│       └── components/
│           ├── LoginScreen.tsx PIN login with staff selector
│           ├── Sidebar.tsx     Navigation with KDS badge counter
│           ├── POSView.tsx     Menu grid + order panel (full API)
│           ├── TablesView.tsx  SVG floor plan + real chair graphics
│           ├── KDSView.tsx     Live kitchen tickets + 1s timer
│           ├── InventoryView.tsx Stock table with inline editing
│           ├── AnalyticsView.tsx Revenue charts from API
│           ├── ModifierModal.tsx Item modifier selection
│           ├── PaymentModal.tsx  Cash/Card/Split + change calculation
│           └── PinModal.tsx     Switch staff / sign out
│
├── start_backend.sh / .bat
└── start_frontend.sh / .bat
```

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/staff/members/pin-login/` | PIN login → JWT tokens |
| GET  | `/api/menu/categories/full-menu/` | Full menu tree |
| GET  | `/api/tables/` | All tables with status |
| PATCH | `/api/tables/{id}/set-status/` | Update table status |
| POST | `/api/orders/` | Create order |
| POST | `/api/orders/{id}/add-line/` | Add item to order |
| PATCH | `/api/orders/{id}/lines/{lid}/kds-status/` | Advance KDS status |
| POST | `/api/orders/{id}/pay/` | Process payment |
| POST | `/api/orders/{id}/void/` | Void order |
| GET  | `/api/inventory/ingredients/` | Stock list |
| GET  | `/api/analytics/dashboard/` | Revenue + stats |
| WS   | `ws://localhost:8000/ws/pos/` | Real-time events |

### WebSocket Events (broadcast to all connected clients)
- `order.created` — new order sent to kitchen
- `order.updated` — item added/removed
- `kds.updated` — KDS status changed
- `order.paid` — order closed

---

## Switch to PostgreSQL (Production)

Set environment variables before running:
```bash
export DB_ENGINE=django.db.backends.postgresql
export DB_NAME=lightpos
export DB_USER=postgres
export DB_PASSWORD=yourpassword
export DB_HOST=localhost
export DB_PORT=5432
export SECRET_KEY=your-secret-key-here
export DEBUG=False
```

For real-time at scale, switch Channel Layers to Redis in `settings.py`:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [('127.0.0.1', 6379)]},
    }
}
```
Then: `pip install channels-redis`
# Leitex
