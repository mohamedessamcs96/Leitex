import { useState, useEffect } from 'react'
import { analytics } from '../api'
import type { ReportRange } from '../api'
import { formatCents } from '../store'
import { useStore } from '../store'

const card: React.CSSProperties = { background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '16px 20px' }
const sectionTitle: React.CSSProperties = { fontWeight: 600, fontSize: 13, marginBottom: 14, color: 'var(--t1)' }

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  CASH:      { label: 'Cash',          color: 'var(--green)' },
  CARD:      { label: 'Card',          color: 'var(--blue)' },
  SPLIT:     { label: 'Split',         color: 'var(--purple)' },
  VOUCHER:   { label: 'Voucher',       color: 'var(--amber)' },
  GIFT_CARD: { label: 'Gift Card',     color: 'var(--teal)' },
  LOYALTY:   { label: 'Loyalty Points', color: '#ec4899' },
}

const RANGE_OPTIONS: { id: ReportRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom' },
]

function toCSVValue(v: any): string {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(toCSVValue).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AnalyticsView() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange]     = useState<ReportRange>('today')
  const today = new Date().toISOString().slice(0, 10)
  const [customStart, setCustomStart] = useState(today)
  const [customEnd, setCustomEnd]     = useState(today)
  const orders = useStore((s) => s.orders)

  useEffect(() => { load() }, [range, customStart, customEnd])

  async function load() {
    if (range === 'custom' && (!customStart || !customEnd)) return
    setLoading(true)
    try {
      const res = await analytics.dashboard(range, customStart, customEnd)
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
        Loading analytics...
      </div>
    )
  }

  const summary       = data?.summary || {}
  const weekData      = data?.week || []
  const topItems      = data?.top_items || []
  const openTables    = data?.open_tables || 0
  const paymentMethods = data?.payment_methods || []
  const byCategory    = data?.by_category || []
  const byStaff       = data?.by_staff || []
  const byHour        = data?.by_hour || []
  const maxWeekVal    = Math.max(...weekData.map((d: any) => d.revenue), 1)
  const maxCategoryVal = Math.max(...byCategory.map((c: any) => c.revenue), 1)
  const maxStaffVal   = Math.max(...byStaff.map((s: any) => s.revenue), 1)
  const maxHourVal    = Math.max(...byHour.map((h: any) => h.revenue), 1)
  const totalPayments = paymentMethods.reduce((s: number, p: any) => s + p.amount, 0) || 1

  const rangeLabel = data?.range
    ? data.range.start === data.range.end ? data.range.start : `${data.range.start} → ${data.range.end}`
    : ''

  function handleExport() {
    const rows: (string | number)[][] = []
    rows.push(['LightPOS Report'])
    rows.push(['Range', rangeLabel])
    rows.push([])
    rows.push(['Summary'])
    rows.push(['Net Revenue', (summary.revenue || 0) / 100])
    rows.push(['Gross Revenue', (summary.gross_revenue || 0) / 100])
    rows.push(['Orders', summary.order_count || 0])
    rows.push(['Avg Order Value', (summary.avg_order_value || 0) / 100])
    rows.push(['Items Sold', summary.items_sold || 0])
    rows.push(['Total Discounts', (summary.total_discount || 0) / 100])
    rows.push(['Voided Orders', summary.voided_count || 0])
    rows.push(['Voided Value', (summary.voided_value || 0) / 100])
    rows.push([])
    rows.push(['Payment Method', 'Amount', 'Count'])
    paymentMethods.forEach((p: any) => rows.push([PAYMENT_LABELS[p.method]?.label || p.method, (p.amount || 0) / 100, p.count]))
    rows.push([])
    rows.push(['Category', 'Revenue', 'Qty'])
    byCategory.forEach((c: any) => rows.push([c.name || 'Uncategorized', (c.revenue || 0) / 100, c.qty]))
    rows.push([])
    rows.push(['Staff', 'Revenue', 'Orders'])
    byStaff.forEach((s: any) => rows.push([s.staff_name, (s.revenue || 0) / 100, s.order_count]))
    rows.push([])
    rows.push(['Top Item', 'Qty Sold', 'Revenue'])
    topItems.forEach((i: any) => rows.push([i.name, i.total_qty, (i.total_revenue || 0) / 100]))

    downloadCSV(`lightpos-report-${data?.range?.start || 'today'}_${data?.range?.end || ''}.csv`, rows)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Analytics &amp; Reports</span>

        <div style={{ display: 'flex', gap: 6 }}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${range === r.id ? 'var(--accent)' : 'var(--b2)'}`,
                background: range === r.id ? 'rgba(232,97,44,0.12)' : 'var(--s2)',
                color: range === r.id ? 'var(--accent)' : 'var(--t2)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)}
              style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 6, color: 'var(--t1)', fontSize: 11, padding: '4px 8px' }} />
            <span style={{ color: 'var(--t3)', fontSize: 11 }}>to</span>
            <input type="date" value={customEnd} min={customStart} max={today} onChange={(e) => setCustomEnd(e.target.value)}
              style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 6, color: 'var(--t1)', fontSize: 11, padding: '4px 8px' }} />
          </div>
        )}

        {rangeLabel && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{rangeLabel}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={handleExport} disabled={!data} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 11, cursor: data ? 'pointer' : 'not-allowed' }}>
            Export CSV
          </button>
          <button onClick={load} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 11, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {[
            { label: 'Net Revenue',    value: formatCents(summary.revenue || 0),    sub: `${formatCents(summary.gross_revenue || 0)} gross`, color: 'var(--green)' },
            { label: 'Orders',         value: String(summary.order_count || 0),     sub: `${summary.items_sold || 0} items sold`, color: 'var(--t1)' },
            { label: 'Avg Order',      value: formatCents(summary.avg_order_value || 0), sub: 'per order', color: 'var(--t1)' },
            { label: 'Discounts',      value: formatCents(summary.total_discount || 0), sub: 'given away', color: 'var(--amber)' },
            { label: 'Voided',         value: String(summary.voided_count || 0),    sub: `${formatCents(summary.voided_value || 0)} lost`, color: 'var(--red)' },
            { label: 'Open Tables',    value: String(openTables),                   sub: 'right now', color: 'var(--t1)' },
          ].map((kpi) => (
            <div key={kpi.label} style={card}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Weekly revenue chart */}
          <div style={card}>
            <div style={sectionTitle}>Last 7 Days</div>
            {weekData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                {weekData.map((d: any, i: number) => {
                  const isToday = i === weekData.length - 1
                  const barH = Math.round((d.revenue / maxWeekVal) * 100)
                  return (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {d.revenue > 0 ? formatCents(d.revenue).replace('€', '') : '—'}
                      </div>
                      <div style={{ width: '100%', height: Math.max(barH, 2), borderRadius: '4px 4px 2px 2px', background: isToday ? 'var(--accent)' : 'rgba(232,97,44,0.18)', border: `1px solid ${isToday ? 'var(--accent)' : 'rgba(232,97,44,0.25)'}`, transition: 'height .3s ease', minHeight: 3 }} />
                      <div style={{ fontSize: 10, color: isToday ? 'var(--t1)' : 'var(--t3)', fontWeight: isToday ? 600 : 400 }}>{d.day}</div>
                    </div>
                  )
                })}
              </div>
            ) : <div style={{ color: 'var(--t3)', fontSize: 12 }}>No data.</div>}
          </div>

          {/* Hourly revenue chart */}
          <div style={card}>
            <div style={sectionTitle}>Revenue by Hour</div>
            {byHour.some((h: any) => h.revenue > 0) ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
                {byHour.map((h: any) => {
                  const barH = Math.round((h.revenue / maxHourVal) * 100)
                  const isPeak = h.revenue === maxHourVal && h.revenue > 0
                  return (
                    <div key={h.hour} title={`${h.hour}:00 — ${formatCents(h.revenue)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: '100%', height: Math.max(barH, 2), borderRadius: '2px 2px 1px 1px', background: isPeak ? 'var(--accent)' : 'rgba(232,97,44,0.18)', minHeight: 2 }} />
                      {h.hour % 3 === 0 && <div style={{ fontSize: 8, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>{h.hour}</div>}
                    </div>
                  )
                })}
              </div>
            ) : <div style={{ color: 'var(--t3)', fontSize: 12 }}>No sales recorded for this range.</div>}
          </div>
        </div>

        {/* Breakdown grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {/* Payment methods */}
          <div style={card}>
            <div style={sectionTitle}>Payment Methods</div>
            {paymentMethods.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: 12 }}>No payments yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paymentMethods.map((p: any) => {
                  const info = PAYMENT_LABELS[p.method] || { label: p.method, color: 'var(--t2)' }
                  const pct = Math.round((p.amount / totalPayments) * 100)
                  return (
                    <div key={p.method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{info.label}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--t3)' }}>{p.count}x · {pct}%</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(p.amount)}</span>
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: info.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sales by category */}
          <div style={card}>
            <div style={sectionTitle}>Sales by Category</div>
            {byCategory.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: 12 }}>No sales data.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byCategory.map((c: any) => (
                  <div key={c.name || 'uncategorized'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{c.name || 'Uncategorized'}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>x{c.qty}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(c.revenue)}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                      <div style={{ width: `${(c.revenue / maxCategoryVal) * 100}%`, height: '100%', background: c.color || 'var(--accent)', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff performance */}
          <div style={card}>
            <div style={sectionTitle}>Staff Performance</div>
            {byStaff.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: 12 }}>No sales data.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byStaff.map((s: any, i: number) => (
                  <div key={s.staff_name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace', minWidth: 14 }}>{i + 1}</span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{s.staff_name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{s.order_count} orders</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(s.revenue || 0)}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                      <div style={{ width: `${((s.revenue || 0) / maxStaffVal) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Top items */}
          <div style={card}>
            <div style={sectionTitle}>Top Items</div>
            {topItems.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: 12 }}>No sales data yet. Start taking orders to see top items.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topItems.slice(0, 6).map((item: any, i: number) => {
                  const maxRev = topItems[0].total_revenue
                  return (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace', minWidth: 14 }}>{i + 1}</span>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--t3)' }}>x{item.total_qty}</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--t2)' }}>{formatCents(item.total_revenue)}</span>
                        </div>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'var(--b2)', overflow: 'hidden' }}>
                        <div style={{ width: `${(item.total_revenue / maxRev) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div style={card}>
            <div style={sectionTitle}>Recent Orders</div>
            {orders.length === 0 ? (
              <div style={{ color: 'var(--t3)', fontSize: 12 }}>No orders yet this session.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orders.slice(0, 8).map((order) => {
                  const total = order.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) - order.discount
                  const statusColor = order.status === 'PAID' ? 'var(--green)' : order.status === 'VOIDED' ? 'var(--red)' : order.status === 'READY' ? 'var(--teal)' : 'var(--amber)'
                  return (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6, background: 'var(--s2)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--t3)', minWidth: 64 }}>#{order.id}</span>
                      <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>
                        {order.tableLabel ? `Table ${order.tableLabel}` : 'Takeaway'}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(total)}</span>
                      <span style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>{order.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
