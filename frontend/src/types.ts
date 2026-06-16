export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN'

export interface Staff {
  id: string; name: string; role: Role; pin: string
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'BILL'

export interface RestaurantTable {
  id: string; label: string; seats: number; status: TableStatus
  posX: number; posY: number; activeOrderId?: string
}

export type MenuCategory = 'STARTERS' | 'MAINS' | 'DESSERTS' | 'DRINKS' | 'COFFEE' | 'SPECIALS'

export interface ModOption { id: string; label: string; priceAdj: number }
export interface Modifier  { id: string; name: string; required: boolean; options: ModOption[] }

export interface MenuItem {
  id: string; name: string; price: number; category: MenuCategory
  description?: string; available: boolean; modifiers?: Modifier[]
  station: 'kitchen' | 'bar' | 'any'
}

export type KDSStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED'

export interface OrderLine {
  id: string; menuItemId: string; name: string; quantity: number
  unitPrice: number; modOptions: string[]; note?: string
  kdsStatus: KDSStatus; station: string
}

export type OrderStatus = 'OPEN' | 'SENT' | 'READY' | 'PAID' | 'VOIDED'
export type OrderType   = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
export type PayMethod   = 'CASH' | 'CARD' | 'SPLIT' | 'VOUCHER' | 'GIFT_CARD' | 'LOYALTY'

export interface Payment { method: PayMethod; amount: number }

export interface Order {
  id: string; tableId?: string; tableLabel?: string
  staffId: string; staffName: string
  customerId?: string; customerName?: string
  status: OrderStatus; type: OrderType
  lines: OrderLine[]; payments: Payment[]
  discount: number; createdAt: Date; closedAt?: Date
}

export type View =
  | 'pos' | 'tables' | 'kds' | 'inventory' | 'analytics'
  | 'backoffice' | 'crm' | 'delivery' | 'subscriptions'
