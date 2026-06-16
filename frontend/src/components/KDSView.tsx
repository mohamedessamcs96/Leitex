import { useState, useEffect } from 'react'
import { useStore } from '../store'
import type { KDSStatus, Order } from '../types'

const KDS_NEXT: Record<KDSStatus, KDSStatus | null> = {
  PENDING: 'COOKING',
  COOKING: 'READY',
  READY:   'SERVED',
  SERVED:  null,
}

const KDS_COLOR: Record<KDSStatus, string> = {
  PENDING: 'var(--amber)',
  COOKING: 'var(--red)',
  READY:   'var(--green)',
  SERVED:  'var(--t3)',
}
const KDS_BG: Record<KDSStatus, string> = {
  PENDING: 'var(--amber-bg)',
  COOKING: 'var(--red-bg)',
  READY:   'var(--green-bg)',
  SERVED:  'var(--s3)',
}

function getElapsedLabel(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

function useTimer() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return tick
}

export default function KDSView() {
  const orders       = useStore((s) => s.orders)
  const advanceKDS   = useStore((s) => s.advanceKDS)
  const showToast    = useStore((s) => s.showToast)
  const loadOrders   = useStore((s) => s.loadOrders)
  useTimer() // force re-render every second for timers

  // Poll every 10s in case WebSocket is not available
  useEffect(() => {
    const id = setInterval(() => loadOrders(), 10000)
    return () => clearInterval(id)
  }, [])

  const activeOrders = orders.filter(
    (o) =>
      (o.status === 'SENT' || o.status === 'READY' || o.status === 'PAID') &&
      o.lines.some((l) => l.kdsStatus !== 'SERVED')
  )

  const pendingCount = activeOrders.reduce(
    (n, o) => n + o.lines.filter((l) => l.kdsStatus === 'PENDING').length, 0
  )
  const cookingCount = activeOrders.reduce(
    (n, o) => n + o.lines.filter((l) => l.kdsStatus === 'COOKING').length, 0
  )
  const readyCount = activeOrders.reduce(
    (n, o) => n + o.lines.filter((l) => l.kdsStatus === 'READY').length, 0
  )

  async function handleAdvanceLine(order: Order, lineId: string, current: KDSStatus) {
    await advanceKDS(parseInt(order.id), parseInt(lineId), current)
    const next = KDS_NEXT[current]
    if (next === 'READY') showToast('Item ready')
    if (next === 'SERVED') showToast('Item served')
  }

  async function handleStartAll(order: Order) {
    for (const line of order.lines.filter((l) => l.kdsStatus === 'PENDING')) {
      await advanceKDS(parseInt(order.id), parseInt(line.id), 'PENDING')
    }
    showToast(`All items started for ${order.id}`)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 20, background: 'var(--s1)' }}>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Kitchen Display</span>

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Pending', count: pendingCount, color: '#f59e0b' },
            { label: 'Cooking', count: cookingCount, color: '#ef4444' },
            { label: 'Ready',   count: readyCount,   color: '#22c55e' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
              <span style={{ color: 'var(--t2)' }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', minWidth: 16 }}>{s.count}</span>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>
            {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => loadOrders()}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 11, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tickets grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignContent: 'flex-start' }}>
        {activeOrders.length === 0 ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--t3)', gap: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M12 2C8 2 4 5 4 9c0 3 1.5 5.5 4 7v2h8v-2c2.5-1.5 4-4 4-7 0-4-4-7-8-7z"/>
              <path d="M9 17v3M15 17v3M9 20h6"/>
            </svg>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Kitchen is clear</div>
            <div style={{ fontSize: 13 }}>New orders will appear here in real-time</div>
          </div>
        ) : (
          activeOrders.map((order) => (
            <KDSTicket
              key={order.id}
              order={order}
              onAdvance={(lineId, status) => handleAdvanceLine(order, lineId, status)}
              onStartAll={() => handleStartAll(order)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function KDSTicket({
  order,
  onAdvance,
  onStartAll,
}: {
  order: Order
  onAdvance: (lineId: string, status: KDSStatus) => void
  onStartAll: () => void
}) {
  useTimer()
  const elapsedSecs = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)
  const isLate      = elapsedSecs > 600
  const isWarning   = elapsedSecs > 300

  const borderColor = isLate ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--b2)'
  const headerBg    = isLate ? 'var(--red-bg)' : isWarning ? 'var(--amber-bg)' : 'var(--s2)'
  const elapsed     = getElapsedLabel(order.createdAt)

  const hasPending  = order.lines.some((l) => l.kdsStatus === 'PENDING')
  const allServed   = order.lines.every((l) => l.kdsStatus === 'SERVED')

  return (
    <div style={{
      width: 268,
      background: 'var(--s1)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color .3s',
      opacity: allServed ? 0.5 : 1,
    }}>
      {/* Ticket header */}
      <div style={{ background: headerBg, padding: '10px 12px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
            #{order.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
            {order.tableLabel ? `Table ${order.tableLabel}` : 'Takeaway'} · {order.staffName.split(' ')[0]}
          </div>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600,
          color: isLate ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--t2)',
          background: isLate ? 'var(--red-bg)' : isWarning ? 'var(--amber-bg)' : 'var(--s3)',
          padding: '3px 8px', borderRadius: 5,
        }}>
          {elapsed}
        </div>
      </div>

      {/* Order lines */}
      <div style={{ padding: '6px 0' }}>
        {order.lines.map((line) => {
          const next = KDS_NEXT[line.kdsStatus]
          return (
            <div
              key={line.id}
              style={{
                padding: '7px 12px',
                borderBottom: '1px solid var(--b1)',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: line.kdsStatus === 'SERVED' ? 0.4 : 1,
                background: line.kdsStatus === 'READY' ? 'rgba(34,197,94,0.04)' : 'transparent',
                transition: 'all .2s',
              }}
            >
              {/* Station indicator */}
              <div style={{
                width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                background: line.station === 'bar' ? 'var(--blue)' : 'var(--amber)',
              }} />

              {/* Qty */}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: KDS_COLOR[line.kdsStatus], minWidth: 22, flexShrink: 0 }}>
                {line.quantity}x
              </span>

              {/* Name + mods */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: line.kdsStatus === 'SERVED' ? 400 : 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: line.kdsStatus === 'SERVED' ? 'line-through' : 'none',
                }}>
                  {line.name}
                </div>
                {line.modOptions && line.modOptions.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {line.modOptions.join(' · ')}
                  </div>
                )}
                {line.note && (
                  <div style={{ fontSize: 10, color: 'var(--amber)', fontStyle: 'italic' }}>
                    Note: {line.note}
                  </div>
                )}
              </div>

              {/* Status button */}
              {next ? (
                <button
                  onClick={() => onAdvance(line.id, line.kdsStatus)}
                  style={{
                    padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                    background: KDS_BG[line.kdsStatus],
                    color: KDS_COLOR[line.kdsStatus],
                    fontSize: 10, fontWeight: 600, flexShrink: 0, transition: 'opacity .12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                >
                  {line.kdsStatus === 'PENDING' ? 'Start' : line.kdsStatus === 'COOKING' ? 'Ready' : 'Serve'}
                </button>
              ) : (
                <span style={{ fontSize: 10, color: 'var(--t3)', padding: '3px 8px', background: 'var(--s3)', borderRadius: 5, flexShrink: 0 }}>
                  Done
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {hasPending && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--b1)' }}>
          <button
            onClick={onStartAll}
            style={{
              width: '100%', padding: '7px', borderRadius: 6, border: 'none',
              background: 'var(--s3)', color: 'var(--t2)', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', transition: 'background .1s',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--s4)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--s3)'}
          >
            Start All Pending
          </button>
        </div>
      )}
    </div>
  )
}
