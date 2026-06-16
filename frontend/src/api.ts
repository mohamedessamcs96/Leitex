/**
 * LightPOS API Client
 * All communication with the Django backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const WS_URL   = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000/ws/pos/'

// ── Token management ──────────────────────────────────────
let _accessToken: string | null = localStorage.getItem('access_token')
let _refreshToken: string | null = localStorage.getItem('refresh_token')

export function setTokens(access: string, refresh: string) {
  _accessToken  = access
  _refreshToken = refresh
  localStorage.setItem('access_token',  access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  _accessToken  = null
  _refreshToken = null
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function getAccessToken() {
  return _accessToken
}

// ── HTTP helper ───────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401 && retry && _refreshToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return request<T>(path, options, false)
    clearTokens()
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || JSON.stringify(err))
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: _refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    _accessToken = data.access
    localStorage.setItem('access_token', data.access)
    return true
  } catch {
    return false
  }
}

// ── Auth ─────────────────────────────────────────────────
export const auth = {
  pinLogin: (pin: string) =>
    request<{ access: string; refresh: string; staff: any }>('/staff/members/pin-login/', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  login: (username: string, password: string) =>
    request<{ access: string; refresh: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<any>('/staff/members/me/'),
}

// ── Menu ─────────────────────────────────────────────────
export const menu = {
  fullMenu:    () => request<any[]>('/menu/categories/full-menu/'),
  categories:  () => request<any[]>('/menu/categories/'),
  items:       (params?: string) => request<any>(`/menu/items/${params ? '?' + params : ''}`),
  toggleItem:  (id: number) => request<any>(`/menu/items/${id}/toggle-availability/`, { method: 'PATCH' }),
}

// ── Tables ────────────────────────────────────────────────
export const tables = {
  list:      () => request<any[]>('/tables/'),
  setStatus: (id: number, status: string) =>
    request<any>(`/tables/${id}/set-status/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  create: (data: { label: string; seats: number; pos_x: number; pos_y: number; zone?: string }) =>
    request<any>('/tables/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ label: string; seats: number; pos_x: number; pos_y: number; zone: string }>) =>
    request<any>(`/tables/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<void>(`/tables/${id}/`, { method: 'DELETE' }),
}

// ── Orders ────────────────────────────────────────────────
export const orders = {
  list:       (active?: boolean) => request<any>(`/orders/${active ? '?active=1' : ''}`),
  get:        (id: number) => request<any>(`/orders/${id}/`),

  create: (data: {
    table_id?: number | null
    lines: Array<{
      menu_item_id: number
      name: string
      quantity: number
      unit_price: number
      mod_options: string[]
      note: string
      station: string
    }>
    discount: number
    notes: string
  }) => request<any>('/orders/', { method: 'POST', body: JSON.stringify(data) }),

  addLine: (orderId: number, line: any) =>
    request<any>(`/orders/${orderId}/add-line/`, { method: 'POST', body: JSON.stringify(line) }),

  removeLine: (orderId: number, lineId: number) =>
    request<void>(`/orders/${orderId}/lines/${lineId}/`, { method: 'DELETE' }),

  updateKDS: (orderId: number, lineId: number, kds_status: string) =>
    request<any>(`/orders/${orderId}/lines/${lineId}/kds-status/`, {
      method: 'PATCH', body: JSON.stringify({ kds_status }),
    }),

  pay: (orderId: number, method: string, amount: number, reference = '') =>
    request<any>(`/orders/${orderId}/pay/`, {
      method: 'POST', body: JSON.stringify({ method, amount, reference }),
    }),

  void: (orderId: number) =>
    request<any>(`/orders/${orderId}/void/`, { method: 'POST' }),

  setDiscount: (orderId: number, discount: number) =>
    request<any>(`/orders/${orderId}/set-discount/`, {
      method: 'PATCH', body: JSON.stringify({ discount }),
    }),
}

// ── Inventory ─────────────────────────────────────────────
export const inventory = {
  ingredients: () => request<any[]>('/inventory/ingredients/'),
  lowStock:    () => request<any[]>('/inventory/ingredients/low-stock/'),
  update:      (id: number, data: any) =>
    request<any>(`/inventory/ingredients/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Analytics ─────────────────────────────────────────────
export type ReportRange = 'today' | 'week' | 'month' | 'custom'

export const analytics = {
  dashboard: (range: ReportRange = 'today', start?: string, end?: string) => {
    const params = new URLSearchParams({ range })
    if (range === 'custom' && start && end) {
      params.set('start', start)
      params.set('end', end)
    }
    return request<any>(`/analytics/dashboard/?${params.toString()}`)
  },
}

// ── WebSocket ─────────────────────────────────────────────
export class POSSocket {
  private ws: WebSocket | null = null
  private handlers: Map<string, ((data: any) => void)[]> = new Map()
  private pingInterval: ReturnType<typeof setInterval> | null = null

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      this.pingInterval = setInterval(() => {
        this.ws?.send(JSON.stringify({ type: 'ping' }))
      }, 25000)
    }

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        const handlers = this.handlers.get(msg.event) || []
        handlers.forEach((h) => h(msg.data))
      } catch {}
    }

    this.ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 3s')
      if (this.pingInterval) clearInterval(this.pingInterval)
      setTimeout(() => this.connect(), 3000)
    }

    this.ws.onerror = () => this.ws?.close()
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler)
    return () => {
      const list = this.handlers.get(event) || []
      this.handlers.set(event, list.filter((h) => h !== handler))
    }
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval)
    this.ws?.close()
  }
}

export const posSocket = new POSSocket()

// ── Customers / CRM ───────────────────────────────────────
export const customers = {
  list:        (search = '') => request<any>(`/customers/profiles/${search ? `?search=${search}` : ''}`),
  get:         (id: number)  => request<any>(`/customers/profiles/${id}/`),
  create:      (data: any)   => request<any>('/customers/profiles/', { method: 'POST', body: JSON.stringify(data) }),
  addPoints:   (id: number, points: number, note = '') =>
    request<any>(`/customers/profiles/${id}/add-points/`, { method: 'POST', body: JSON.stringify({ points, note }) }),
  redeemPoints:(id: number, points: number) =>
    request<any>(`/customers/profiles/${id}/redeem-points/`, { method: 'POST', body: JSON.stringify({ points }) }),
  giftCards:   () => request<any[]>('/customers/gift-cards/'),
  checkGiftCard:(code: string) => request<any>('/customers/gift-cards/check/', { method: 'POST', body: JSON.stringify({ code }) }),
  reservations:() => request<any[]>('/customers/reservations/'),
  createReservation: (data: any) =>
    request<any>('/customers/reservations/', { method: 'POST', body: JSON.stringify(data) }),
  setReservationStatus: (id: number, status: string) =>
    request<any>(`/customers/reservations/${id}/set-status/`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

// ── Locations ─────────────────────────────────────────────
export const locations = {
  list:    () => request<any[]>('/locations/branches/'),
  summary: (id: number) => request<any>(`/locations/branches/${id}/summary/`),
}

// ── Subscriptions ─────────────────────────────────────────
export const subscriptions = {
  plans:     () => request<any[]>('/subscriptions/plans/'),
  orgs:      () => request<any[]>('/subscriptions/orgs/'),
  addAddon:  (orgId: number, data: any) =>
    request<any>(`/subscriptions/orgs/${orgId}/add-addon/`, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Delivery ──────────────────────────────────────────────
export const delivery = {
  orders:      () => request<any[]>('/delivery/orders/'),
  zones:       () => request<any[]>('/delivery/zones/'),
  qrTables:    () => request<any[]>('/delivery/qr-tables/'),
  advance:     (id: number) => request<any>(`/delivery/orders/${id}/advance-status/`, { method: 'PATCH' }),
  createOrder: (data: any) => request<any>('/delivery/orders/', { method: 'POST', body: JSON.stringify(data) }),
}

// ── Clock / Staff time tracking ───────────────────────────
export const clockApi = {
  clockIn:   () => request<any>('/orders/clock/clock-in/',  { method: 'POST' }),
  clockOut:  () => request<any>('/orders/clock/clock-out/', { method: 'POST' }),
  myHours:   () => request<any[]>('/orders/clock/my-hours/'),
  allEntries:() => request<any[]>('/orders/clock/'),
}
