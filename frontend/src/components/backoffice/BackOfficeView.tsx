import { useState, useEffect } from 'react'
import { analytics, orders as ordersApi, tables as tablesApi } from '../../api'
import { formatCents } from '../../store'
import { useStore } from '../../store'

function StatCard({ label, value, sub, color = 'var(--t1)' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const SECTIONS = ['Overview', 'Orders', 'Staff', 'Menu Control', 'Locations']

export default function BackOfficeView() {
  const [section, setSection]   = useState('Overview')
  const [dash, setDash]         = useState<any>(null)
  const [recentOrders, setRecent] = useState<any[]>([])
  const orders = useStore((s) => s.orders)

  useEffect(() => {
    analytics.dashboard().then(setDash).catch(() => {})
    ordersApi.list().then((d: any) => setRecent(Array.isArray(d) ? d.slice(0, 20) : (d.results || []).slice(0, 20))).catch(() => {})
  }, [])

  const sessionPaid = orders.filter((o) => o.status === 'PAID').length
  const sessionRev  = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.unitPrice * l.quantity, 0) - o.discount, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Back Office</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Central management dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 24 }}>
          {SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)} style={{
              padding: '5px 14px', borderRadius: 7, border: 'none',
              background: section === s ? 'var(--s3)' : 'transparent',
              color: section === s ? 'var(--t1)' : 'var(--t3)',
              fontSize: 12, fontWeight: section === s ? 600 : 400, cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {section === 'Overview' && (
          <>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <StatCard label="Today's Revenue"  value={formatCents(dash?.today?.revenue || 0)} sub={`${dash?.today?.order_count || 0} orders`} color="var(--green)" />
              <StatCard label="Session Revenue"  value={formatCents(sessionRev)} sub={`${sessionPaid} paid orders`} />
              <StatCard label="Open Tables"      value={String(dash?.open_tables || 0)} sub="currently occupied" color="var(--amber)" />
              <StatCard label="Active Orders"    value={String(orders.filter((o) => ['OPEN','SENT','READY'].includes(o.status)).length)} sub="in kitchen or open" color="var(--accent)" />
            </div>

            {/* Weekly chart */}
            {dash?.week && (
              <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>Weekly Revenue</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
                  {dash.week.map((d: any, i: number) => {
                    const max = Math.max(...dash.week.map((x: any) => x.revenue), 1)
                    const h = Math.max(Math.round((d.revenue / max) * 88), 2)
                    const isToday = i === dash.week.length - 1
                    return (
                      <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {d.revenue > 0 ? formatCents(d.revenue).replace('€','') : ''}
                        </div>
                        <div style={{ width: '100%', height: h, background: isToday ? 'var(--accent)' : 'rgba(232,97,44,0.18)', borderRadius: '4px 4px 2px 2px', border: `1px solid ${isToday ? 'var(--accent)' : 'rgba(232,97,44,0.25)'}` }} />
                        <div style={{ fontSize: 10, color: isToday ? 'var(--t1)' : 'var(--t3)', fontWeight: isToday ? 600 : 400 }}>{d.day}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ready & Takeaway section */}
            {(recentOrders.length > 0 || orders.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Ready for Pickup */}
                <div style={{ background: 'var(--s1)', border: '2px solid var(--teal)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontWeight: 600, fontSize: 13, color: 'var(--teal)' }}>
                    ✅ Ready for Pickup ({orders.filter(o => o.status === 'READY').length})
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {orders.filter(o => o.status === 'READY').length > 0 ? (
                      orders.filter(o => o.status === 'READY').map((order: any) => (
                        <div key={order.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--b2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>#{order.id} — {order.table_label || 'Takeaway'}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)' }}>{order.lines?.length || 0} items</div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{formatCents(order.total || 0)}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>No orders ready</div>
                    )}
                  </div>
                </div>

                {/* Takeaway/Delivery */}
                <div style={{ background: 'var(--s1)', border: '2px solid var(--amber)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontWeight: 600, fontSize: 13, color: 'var(--amber)' }}>
                    🥡 Takeaway & Delivery ({orders.filter(o => ['TAKEAWAY','DELIVERY'].includes(o.type)).length})
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {orders.filter(o => ['TAKEAWAY','DELIVERY'].includes(o.type)).length > 0 ? (
                      orders.filter(o => ['TAKEAWAY','DELIVERY'].includes(o.type)).map((order: any) => (
                        <div key={order.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--b2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>#{order.id} {order.type === 'DELIVERY' ? '🚗' : '🥡'}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)' }}>{order.status}</div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', fontFamily: 'JetBrains Mono' }}>{formatCents(order.total || 0)}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>None</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontWeight: 600, fontSize: 13 }}>Recent Orders</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--s2)' }}>
                    {['Order','Type','Table','Staff','Status','Total','Time'].map((h) => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders.length > 0 ? recentOrders : orders.slice(0, 15)).map((order: any) => {
                    const total    = order.total ?? (order.lines?.reduce((s: number, l: any) => s + l.unit_price * l.quantity, 0) - (order.discount || 0))
                    const status   = order.status
                    const sColor   = status === 'PAID' ? 'var(--green)' : status === 'VOIDED' ? 'var(--red)' : status === 'READY' ? 'var(--teal)' : 'var(--amber)'
                    const typeIcon = order.type === 'DELIVERY' ? '🚗' : order.type === 'TAKEAWAY' ? '🥡' : '🍽'
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--b1)' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--s2)'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '9px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>#{order.id}</td>
                        <td style={{ padding: '9px 14px', fontSize: 12 }}>{order.type || 'DINE_IN'}</td>
                        <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--t2)' }}>{order.table_label || '—'}</td>
                        <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--t2)' }}>{order.staff_name || order.staffName || '—'}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${sColor}18`, color: sColor }}>{status}</span>
                        </td>
                        <td style={{ padding: '9px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(total || 0)}</td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--t3)' }}>
                          {new Date(order.created_at || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {recentOrders.length === 0 && orders.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>No orders yet</div>
              )}
            </div>
          </>
        )}

        {section === 'Staff' && <StaffPanel />}
        {section === 'Menu Control' && <MenuControlPanel />}
        {section === 'Locations' && <LocationsPanel />}
        {section === 'Orders' && <OrdersPanel orders={recentOrders.length > 0 ? recentOrders : orders} />}
      </div>
    </div>
  )
}

function StaffPanel() {
  const [entries, setEntries] = useState<any[]>([])
  useEffect(() => {
    fetch('http://localhost:8000/api/orders/clock/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).then(r => r.json()).then(d => setEntries(Array.isArray(d) ? d : d.results || [])).catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Staff Management</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { name: 'James Laurent', role: 'Manager', status: 'Clocked In', hours: '6h 42m', color: 'var(--green)' },
          { name: 'Sofia Reyes',   role: 'Cashier',  status: 'Clocked In', hours: '5h 15m', color: 'var(--green)' },
          { name: 'Marco Ferretti',role: 'Waiter',   status: 'Clocked In', hours: '4h 30m', color: 'var(--green)' },
          { name: 'Anna Kovacs',   role: 'Waiter',   status: 'Clocked In', hours: '4h 30m', color: 'var(--green)' },
          { name: 'Chen Wei',      role: 'Kitchen',  status: 'Clocked In', hours: '7h 00m', color: 'var(--green)' },
        ].map((s) => (
          <div key={s.name} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple-bg)', border: '1px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>
                {s.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 600, height: 'fit-content' }}>
                {s.status}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{s.role}</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Hours today</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--t2)' }}>{s.hours}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MenuControlPanel() {
  const menuCategories = useStore((s) => s.menuCategories)
  const loadMenu = useStore((s) => s.loadMenu)
  const showToast = useStore((s) => s.showToast)

  const allItems = menuCategories.flatMap((c: any) => (c.items || []).map((i: any) => ({ ...i, categoryName: c.name, categoryColor: c.color })))

  async function toggle(item: any) {
    try {
      await fetch(`http://localhost:8000/api/menu/items/${item.id}/toggle-availability/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      })
      showToast(`${item.name} ${item.is_available ? 'disabled' : 'enabled'}`)
      await loadMenu()
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Menu Control</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {allItems.map((item: any) => (
          <div key={item.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, opacity: item.is_available ? 1 : 0.5 }}>
            <div style={{ width: 3, height: 32, borderRadius: 2, background: item.categoryColor || 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{item.categoryName}</div>
            </div>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', flexShrink: 0 }}>€{(item.price/100).toFixed(2)}</div>
            <button onClick={() => toggle(item)} style={{
              width: 38, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: item.is_available ? 'var(--green)' : 'var(--s3)',
              transition: 'background .2s', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 2, left: item.is_available ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function LocationsPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Multi-Location Management</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { name: 'Main Restaurant', city: 'Berlin', status: 'Open', revenue: 128400, orders: 34, tables: '7/12', badge: 'MAIN' },
          { name: 'Patio Branch', city: 'Berlin', status: 'Open', revenue: 64200, orders: 18, tables: '3/6', badge: 'BRANCH' },
        ].map((loc) => (
          <div key={loc.name} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{loc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{loc.city}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>{loc.status}</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: 'var(--blue-bg)', color: 'var(--blue)' }}>{loc.badge}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { l: 'Revenue', v: formatCents(loc.revenue) },
                { l: 'Orders', v: String(loc.orders) },
                { l: 'Tables', v: loc.tables },
              ].map((s) => (
                <div key={s.l} style={{ background: 'var(--s2)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.l}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrdersPanel({ orders }: { orders: any[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>All Orders</div>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--s2)' }}>
              {['#','Type','Table','Customer','Staff','Items','Discount','Total','Status','Time'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => {
              const subtotal = order.total ?? (order.lines?.reduce((s: number, l: any) => s + (l.unit_price || l.unitPrice) * l.quantity, 0) || 0)
              const discount = order.discount || 0
              const status   = order.status
              const sColor   = status === 'PAID' ? 'var(--green)' : status === 'VOIDED' ? 'var(--red)' : status === 'READY' ? 'var(--teal)' : 'var(--amber)'
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--b1)' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--s2)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--t3)' }}>#{order.id}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{order.type || 'DINE_IN'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t2)' }}>{order.table_label || order.tableLabel || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t2)' }}>{order.customer_name || order.customerName || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t2)' }}>{order.staff_name || order.staffName || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{order.lines?.length || 0}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: discount > 0 ? 'var(--green)' : 'var(--t3)' }}>{discount > 0 ? `-${formatCents(discount)}` : '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>{formatCents(subtotal - discount)}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${sColor}18`, color: sColor }}>{status}</span>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t3)' }}>
                    {new Date(order.created_at || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {orders.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>No orders yet</div>}
      </div>
    </div>
  )
}
