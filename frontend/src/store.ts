import { create } from 'zustand'
import { auth, menu, tables, orders, setTokens, clearTokens, posSocket } from './api'
import type { Order, OrderLine, RestaurantTable, Staff, View, PayMethod, KDSStatus } from './types'

interface AppStore {
  // Auth
  currentStaff: Staff | null
  authLoading: boolean
  pinLogin: (pin: string) => Promise<boolean>
  logout: () => void

  // Navigation
  view: View
  setView: (v: View) => void

  // Tables (loaded from backend)
  tables: RestaurantTable[]
  tablesLoading: boolean
  loadTables: () => Promise<void>
  updateTableStatus: (id: number, status: RestaurantTable['status']) => Promise<void>
  createTable: (data: { label: string; seats: number; posX: number; posY: number }) => Promise<void>
  updateTable: (id: number, data: Partial<{ label: string; seats: number; posX: number; posY: number }>) => Promise<void>
  deleteTable: (id: number) => Promise<void>
  selectedTableId: number | null
  setSelectedTable: (id: number | null) => void

  // Menu (loaded from backend)
  menuCategories: any[]
  menuLoading: boolean
  loadMenu: () => Promise<void>

  // Draft order being built in POS
  draftOrder: {
    lines: OrderLine[]
    discount: number
    tableId?: number
    tableLabel?: string
  }
  addLine: (line: Omit<OrderLine, 'id' | 'kdsStatus'>) => void
  removeLine: (id: string) => void
  updateQty: (id: string, delta: number) => void
  setDiscount: (cents: number) => void
  setOrderTable: (tableId: number, tableLabel: string) => void
  clearDraft: () => void

  // Orders from backend
  orders: Order[]
  ordersLoading: boolean
  loadOrders: () => Promise<void>
  submitOrder: () => Promise<Order | null>
  advanceKDS: (orderId: number, lineId: number, current: KDSStatus) => Promise<void>
  payOrder: (orderId: number, method: PayMethod, amount: number) => Promise<void>
  voidOrder: (orderId: number) => Promise<void>

  // UI
  toast: string | null
  showToast: (msg: string) => void
  modifierMenuItemId: string | null
  setModifierItem: (id: string | null) => void
  showPayModal: boolean
  setPayModal: (v: boolean) => void
  showPinModal: boolean
  setShowPinModal: (v: boolean) => void

  // Init
  init: () => Promise<void>
}

const emptyDraft = () => ({ lines: [] as OrderLine[], discount: 0 })

export const useStore = create<AppStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  currentStaff: null,
  authLoading: false,

  pinLogin: async (pin) => {
    set({ authLoading: true })
    try {
      const res = await auth.pinLogin(pin)
      setTokens(res.access, res.refresh)
      const staff: Staff = {
        id:   String(res.staff.id),
        name: res.staff.name,
        role: res.staff.role,
        pin,
      }
      set({ currentStaff: staff })
      await get().init()
      get().showToast(`Welcome, ${staff.name}`)
      return true
    } catch (e: any) {
      get().showToast(e.message || 'Invalid PIN')
      return false
    } finally {
      set({ authLoading: false })
    }
  },

  logout: () => {
    clearTokens()
    set({ currentStaff: null, orders: [], tables: [], menuCategories: [] })
  },

  // ── Navigation ────────────────────────────────────────────
  view: 'pos',
  setView: (v) => set({ view: v }),

  // ── Tables ────────────────────────────────────────────────
  tables: [],
  tablesLoading: false,
  selectedTableId: null,
  setSelectedTable: (id) => set({ selectedTableId: id }),

  loadTables: async () => {
    set({ tablesLoading: true })
    try {
      const data = await tables.list()
      const tablesList = Array.isArray(data) ? data : (data.results || [])
      set({ tables: tablesList.map(mapTable) })
    } catch (e) {
      console.error('Failed to load tables:', e)
    } finally {
      set({ tablesLoading: false })
    }
  },

  updateTableStatus: async (id, status) => {
    const updated = await tables.setStatus(id, status)
    set((s) => ({
      tables: s.tables.map((t) => (t.id === String(id) ? { ...t, status } : t)),
    }))
  },

  createTable: async (data) => {
    const created = await tables.create({
      label: data.label, seats: data.seats, pos_x: data.posX, pos_y: data.posY,
    })
    set((s) => ({ tables: [...s.tables, mapTable(created)] }))
  },

  updateTable: async (id, data) => {
    const payload: Record<string, any> = {}
    if (data.label  !== undefined) payload.label  = data.label
    if (data.seats  !== undefined) payload.seats  = data.seats
    if (data.posX   !== undefined) payload.pos_x  = data.posX
    if (data.posY   !== undefined) payload.pos_y  = data.posY
    const updated = await tables.update(id, payload)
    set((s) => ({
      tables: s.tables.map((t) => (t.id === String(id) ? { ...t, ...mapTable(updated) } : t)),
    }))
  },

  deleteTable: async (id) => {
    await tables.remove(id)
    set((s) => ({
      tables: s.tables.filter((t) => t.id !== String(id)),
      selectedTableId: s.selectedTableId === id ? null : s.selectedTableId,
    }))
  },

  // ── Menu ──────────────────────────────────────────────────
  menuCategories: [],
  menuLoading: false,

  loadMenu: async () => {
    set({ menuLoading: true })
    try {
      const data = await menu.fullMenu()
      set({ menuCategories: data })
    } finally {
      set({ menuLoading: false })
    }
  },

  // ── Draft Order ───────────────────────────────────────────
  draftOrder: emptyDraft(),

  addLine: (line) =>
    set((s) => {
      const existing = s.draftOrder.lines.find(
        (l) => l.menuItemId === line.menuItemId &&
          JSON.stringify(l.modOptions) === JSON.stringify(line.modOptions)
      )
      if (existing) {
        return {
          draftOrder: {
            ...s.draftOrder,
            lines: s.draftOrder.lines.map((l) =>
              l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l
            ),
          },
        }
      }
      return {
        draftOrder: {
          ...s.draftOrder,
          lines: [...s.draftOrder.lines, { ...line, id: crypto.randomUUID(), kdsStatus: 'PENDING' as KDSStatus }],
        },
      }
    }),

  removeLine: (id) =>
    set((s) => ({ draftOrder: { ...s.draftOrder, lines: s.draftOrder.lines.filter((l) => l.id !== id) } })),

  updateQty: (id, delta) =>
    set((s) => ({
      draftOrder: {
        ...s.draftOrder,
        lines: s.draftOrder.lines
          .map((l) => l.id === id ? { ...l, quantity: l.quantity + delta } : l)
          .filter((l) => l.quantity > 0),
      },
    })),

  setDiscount: (cents) =>
    set((s) => ({ draftOrder: { ...s.draftOrder, discount: cents } })),

  setOrderTable: (tableId, tableLabel) =>
    set((s) => ({ draftOrder: { ...s.draftOrder, tableId, tableLabel } })),

  clearDraft: () => set({ draftOrder: emptyDraft() }),

  // ── Orders ────────────────────────────────────────────────
  orders: [],
  ordersLoading: false,

  loadOrders: async () => {
    set({ ordersLoading: true })
    try {
      const data = await orders.list(true)
      const list = Array.isArray(data) ? data : (data.results || [])
      set({ orders: list.map(mapOrder) })
    } finally {
      set({ ordersLoading: false })
    }
  },

  submitOrder: async () => {
    const { draftOrder, currentStaff } = get()
    if (!currentStaff || draftOrder.lines.length === 0) return null

    try {
      const payload = {
        table_id: draftOrder.tableId ?? null,
        lines: draftOrder.lines.map((l) => ({
          menu_item_id: parseInt(l.menuItemId),
          name:         l.name,
          quantity:     l.quantity,
          unit_price:   l.unitPrice,
          mod_options:  l.modOptions,
          note:         l.note || '',
          station:      l.station,
        })),
        discount: draftOrder.discount,
        notes: '',
      }
      const order = await orders.create(payload)
      const mapped = mapOrder(order)

      if (draftOrder.tableId) {
        set((s) => ({
          tables: s.tables.map((t) =>
            t.id === String(draftOrder.tableId) ? { ...t, status: 'OCCUPIED' } : t
          ),
        }))
      }

      set((s) => ({ orders: [mapped, ...s.orders] }))
      get().clearDraft()
      get().showToast(`Order #${order.id} sent to kitchen`)
      return mapped
    } catch (e: any) {
      get().showToast(e.message || 'Failed to submit order')
      return null
    }
  },

  advanceKDS: async (orderId, lineId, current) => {
    const next: Record<KDSStatus, KDSStatus | null> = {
      PENDING: 'COOKING', COOKING: 'READY', READY: 'SERVED', SERVED: null,
    }
    const nextStatus = next[current]
    if (!nextStatus) return
    try {
      const updated = await orders.updateKDS(orderId, lineId, nextStatus)
      const mapped = mapOrder(updated)
      set((s) => ({ orders: s.orders.map((o) => o.id === String(orderId) ? mapped : o) }))
    } catch (e: any) {
      get().showToast(e.message || 'Failed to update status')
    }
  },

  payOrder: async (orderId, method, amount) => {
    try {
      const updated = await orders.pay(orderId, method, amount)
      const mapped = mapOrder(updated)
      set((s) => ({
        orders: s.orders.map((o) => o.id === String(orderId) ? mapped : o),
        tables: s.tables.map((t) =>
          t.activeOrderId === String(orderId) ? { ...t, status: 'FREE', activeOrderId: undefined } : t
        ),
      }))
      get().showToast(`Payment of ${formatCents(amount)} accepted`)
    } catch (e: any) {
      get().showToast(e.message || 'Payment failed')
    }
  },

  voidOrder: async (orderId) => {
    try {
      await orders.void(orderId)
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === String(orderId) ? { ...o, status: 'VOIDED' } : o
        ),
      }))
      get().showToast('Order voided')
    } catch (e: any) {
      get().showToast(e.message || 'Failed to void order')
    }
  },

  // ── UI ────────────────────────────────────────────────────
  toast: null,
  showToast: (msg) => {
    set({ toast: msg })
    setTimeout(() => set({ toast: null }), 2800)
  },
  modifierMenuItemId: null,
  setModifierItem: (id) => set({ modifierMenuItemId: id }),
  showPayModal: false,
  setPayModal: (v) => set({ showPayModal: v }),
  showPinModal: false,
  setShowPinModal: (v) => set({ showPinModal: v }),

  // ── Init (called after login) ─────────────────────────────
  init: async () => {
    await Promise.all([
      get().loadTables(),
      get().loadMenu(),
      get().loadOrders(),
    ])

    // Connect WebSocket for real-time updates
    posSocket.connect()
    posSocket.on('order.created', (data) => {
      const order = mapOrder(data)
      set((s) => ({
        orders: [order, ...s.orders.filter((o) => o.id !== order.id)],
      }))
    })
    posSocket.on('order.updated', (data) => {
      const order = mapOrder(data)
      set((s) => ({ orders: s.orders.map((o) => o.id === order.id ? order : o) }))
    })
    posSocket.on('kds.updated', (data) => {
      const order = mapOrder(data)
      set((s) => ({ orders: s.orders.map((o) => o.id === order.id ? order : o) }))
    })
    posSocket.on('order.paid', (data) => {
      const order = mapOrder(data)
      set((s) => ({ orders: s.orders.map((o) => o.id === order.id ? order : o) }))
      get().loadTables()
    })
  },
}))

// ── Mapping helpers ───────────────────────────────────────
function mapTable(t: any): RestaurantTable {
  return {
    id:      String(t.id),
    label:   t.label,
    seats:   t.seats,
    status:  t.status,
    posX:    t.pos_x,
    posY:    t.pos_y,
  }
}

function mapOrder(o: any): Order {
  return {
    id:          String(o.id),
    tableId:     o.table ? String(o.table) : undefined,
    tableLabel:  o.table_label,
    staffId:     o.staff ? String(o.staff) : '',
    staffName:   o.staff_name || '',
    status:      o.status,
    lines:       (o.lines || []).map(mapLine),
    payments:    (o.payments || []),
    discount:    o.discount || 0,
    createdAt:   new Date(o.created_at),
    closedAt:    o.closed_at ? new Date(o.closed_at) : undefined,
  }
}

function mapLine(l: any): OrderLine {
  return {
    id:         String(l.id),
    menuItemId: l.menu_item ? String(l.menu_item) : '',
    name:       l.name,
    quantity:   l.quantity,
    unitPrice:  l.unit_price,
    modOptions: l.mod_options || [],
    note:       l.note || '',
    kdsStatus:  l.kds_status,
    station:    l.station,
  }
}

export function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

export function getDraftSubtotal(lines: OrderLine[]): number {
  return lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
}
