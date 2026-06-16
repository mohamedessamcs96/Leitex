import { useState, useEffect } from 'react'
import { formatCents } from '../../store'

const API   = 'http://localhost:8000/api'
const tok   = () => localStorage.getItem('access_token') || ''
const apiFetch = (path: string, opts: RequestInit = {}) =>
  fetch(`${API}${path}`, { ...opts, headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } }).then((r) => r.json())

const PLATFORM_COLORS: Record<string, string> = {
  POS:       '#6b7280',
  ONLINE:    '#3b82f6',
  UBER_EATS: '#000000',
  DELIVEROO: '#00CCBC',
  JUST_EAT:  '#ff8000',
  QR_CODE:   '#a855f7',
}

const STATUS_COLOR: Record<string, string> = {
  NEW:       '#f59e0b',
  ACCEPTED:  '#3b82f6',
  PREPARING: '#e8612c',
  READY:     '#22c55e',
  OUT:       '#a855f7',
  DELIVERED: '#6b7280',
  CANCELLED: '#ef4444',
}

const TABS = ['All Orders', 'Delivery', 'Takeaway', 'Zones', 'QR Tables']

export default function DeliveryView() {
  const [tab, setTab]           = useState('All Orders')
  const [orders, setOrders]     = useState<any[]>([])
  const [zones, setZones]       = useState<any[]>([])
  const [qrTables, setQrTables] = useState<any[]>([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [o, z, q] = await Promise.all([
        apiFetch('/delivery/orders/'),
        apiFetch('/delivery/zones/'),
        apiFetch('/delivery/qr-tables/'),
      ])
      setOrders(Array.isArray(o) ? o : o.results || [])
      setZones(Array.isArray(z) ? z : z.results || [])
      setQrTables(Array.isArray(q) ? q : q.results || [])
    } catch {}
    finally { setLoading(false) }
  }

  async function advanceStatus(id: number) {
    await apiFetch(`/delivery/orders/${id}/advance-status/`, { method: 'PATCH' })
    loadAll()
  }

  const filteredOrders = orders.filter((o) => {
    if (tab === 'Delivery')  return o.type === 'DELIVERY'
    if (tab === 'Takeaway')  return o.type === 'TAKEAWAY'
    return true
  })

  // Demo orders if none from API
  const demoOrders = [
    { id: 1001, type: 'DELIVERY',  platform: 'UBER_EATS', status: 'OUT',       customer_name: 'Emma Rossi',  address: 'Friedrichstr. 42', delivery_fee: 290, created_at: new Date(Date.now()-1800000).toISOString() },
    { id: 1002, type: 'DELIVERY',  platform: 'DELIVEROO', status: 'PREPARING', customer_name: 'Luca Bianchi',address: 'Unter den Linden 10', delivery_fee: 350, created_at: new Date(Date.now()-900000).toISOString() },
    { id: 1003, type: 'TAKEAWAY',  platform: 'ONLINE',    status: 'READY',     customer_name: 'Sophie M.',  address: '', delivery_fee: 0, created_at: new Date(Date.now()-600000).toISOString() },
    { id: 1004, type: 'DINE_IN',   platform: 'QR_CODE',   status: 'NEW',       customer_name: 'Table 4 Guest', address: '', delivery_fee: 0, created_at: new Date(Date.now()-120000).toISOString() },
    { id: 1005, type: 'DELIVERY',  platform: 'JUST_EAT',  status: 'ACCEPTED',  customer_name: 'Carlos R.',  address: 'Alexanderplatz 5', delivery_fee: 250, created_at: new Date(Date.now()-300000).toISOString() },
  ]
  const displayOrders = (filteredOrders.length > 0 ? filteredOrders : demoOrders).filter((o) => {
    if (tab === 'Delivery')  return o.type === 'DELIVERY'
    if (tab === 'Takeaway')  return o.type === 'TAKEAWAY'
    return true
  })

  function elapsed(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    return `${Math.floor(s / 60)}m ago`
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Orders & Delivery</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Dine-in · Takeaway · Delivery · QR</div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 14px', borderRadius: 7, border: 'none',
              background: tab === t ? 'var(--s3)' : 'transparent',
              color: tab === t ? 'var(--t1)' : 'var(--t3)',
              fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Platform legend */}
          {['UBER_EATS','DELIVEROO','JUST_EAT','ONLINE','QR_CODE'].map((p) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--t3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[p] }} />
              {p.replace('_',' ')}
            </div>
          ))}
          <button onClick={loadAll} style={{ marginLeft: 8, padding: '0 12px', height: 32, borderRadius: 7, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats row */}
        {(tab === 'All Orders' || tab === 'Delivery' || tab === 'Takeaway') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { label: 'New',       val: (orders.length > 0 ? orders : demoOrders).filter((o) => o.status === 'NEW').length,      color: 'var(--amber)' },
              { label: 'Preparing', val: (orders.length > 0 ? orders : demoOrders).filter((o) => o.status === 'PREPARING').length,color: 'var(--accent)' },
              { label: 'Ready',     val: (orders.length > 0 ? orders : demoOrders).filter((o) => o.status === 'READY').length,    color: 'var(--green)' },
              { label: 'Out',       val: (orders.length > 0 ? orders : demoOrders).filter((o) => o.status === 'OUT').length,      color: 'var(--purple)' },
              { label: 'Delivered', val: (orders.length > 0 ? orders : demoOrders).filter((o) => o.status === 'DELIVERED').length,color: 'var(--t3)' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>{s.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Orders list */}
        {(tab === 'All Orders' || tab === 'Delivery' || tab === 'Takeaway') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayOrders.map((order) => {
              const sc = STATUS_COLOR[order.status] || 'var(--t3)'
              const pc = PLATFORM_COLORS[order.platform] || 'var(--t3)'
              const nextLabel: Record<string, string> = { NEW: 'Accept', ACCEPTED: 'Start Prep', PREPARING: 'Mark Ready', READY: 'Out for Delivery', OUT: 'Delivered' }
              return (
                <div key={order.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Platform dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pc, flexShrink: 0 }} />

                  {/* Order number */}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, minWidth: 52, color: 'var(--t2)' }}>
                    #{order.id}
                  </span>

                  {/* Type badge */}
                  <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--s3)', color: 'var(--t2)', minWidth: 70 }}>
                    {order.type}
                  </span>

                  {/* Platform */}
                  <span style={{ fontSize: 11, color: 'var(--t3)', minWidth: 80 }}>
                    {order.platform?.replace('_', ' ')}
                  </span>

                  {/* Customer + address */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.customer_name || 'Guest'}
                    </div>
                    {order.address && (
                      <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.address}
                      </div>
                    )}
                  </div>

                  {/* Delivery fee */}
                  {order.delivery_fee > 0 && (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--t3)', flexShrink: 0 }}>
                      +{formatCents(order.delivery_fee)} fee
                    </span>
                  )}

                  {/* Elapsed */}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--t3)', minWidth: 54, textAlign: 'right', flexShrink: 0 }}>
                    {elapsed(order.created_at)}
                  </span>

                  {/* Status */}
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${sc}18`, color: sc, minWidth: 80, textAlign: 'center', flexShrink: 0 }}>
                    {order.status}
                  </span>

                  {/* Advance button */}
                  {nextLabel[order.status] && (
                    <button
                      onClick={() => advanceStatus(order.id)}
                      style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                    >
                      {nextLabel[order.status]}
                    </button>
                  )}
                </div>
              )
            })}
            {displayOrders.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>No orders in this category</div>
            )}
          </div>
        )}

        {/* Delivery Zones */}
        {tab === 'Zones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Delivery Zones</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {(zones.length > 0 ? zones : [
                { id: 1, name: 'Zone A — Central', min_order: 1500, delivery_fee: 250, est_minutes: 25, is_active: true },
                { id: 2, name: 'Zone B — East',    min_order: 2000, delivery_fee: 350, est_minutes: 35, is_active: true },
                { id: 3, name: 'Zone C — West',    min_order: 2500, delivery_fee: 450, est_minutes: 45, is_active: true },
                { id: 4, name: 'Zone D — Airport', min_order: 5000, delivery_fee: 850, est_minutes: 60, is_active: false },
              ]).map((zone: any) => (
                <div key={zone.id} style={{ background: 'var(--s1)', border: `1px solid ${zone.is_active ? 'var(--b2)' : 'var(--b1)'}`, borderRadius: 10, padding: '14px 16px', opacity: zone.is_active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{zone.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: zone.is_active ? 'var(--green-bg)' : 'var(--red-bg)', color: zone.is_active ? 'var(--green)' : 'var(--red)' }}>
                      {zone.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                  {[
                    { l: 'Min order',    v: formatCents(zone.min_order) },
                    { l: 'Delivery fee', v: formatCents(zone.delivery_fee) },
                    { l: 'Est. time',    v: `${zone.est_minutes} min` },
                  ].map((s) => (
                    <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--b1)' }}>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{s.l}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Tables */}
        {tab === 'QR Tables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>QR Code Self-Ordering</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Guests scan to order directly from their table</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {(qrTables.length > 0 ? qrTables : Array.from({ length: 12 }, (_, i) => ({
                id: i + 1, table_label: `T${i + 1}`, token: `qr_${Math.random().toString(36).slice(2,10)}`, is_active: i < 10
              }))).map((qr: any) => (
                <div key={qr.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: qr.is_active ? 1 : 0.4 }}>
                  {/* QR placeholder */}
                  <div style={{ width: 64, height: 64, background: 'var(--s2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
                      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
                      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
                      <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Table {qr.table_label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--t3)', textAlign: 'center', wordBreak: 'break-all' }}>
                    {qr.token?.slice(0, 16)}...
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: qr.is_active ? 'var(--green-bg)' : 'var(--red-bg)', color: qr.is_active ? 'var(--green)' : 'var(--red)' }}>
                    {qr.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
