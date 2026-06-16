import { useState, useEffect } from 'react'
import { useStore, formatCents } from '../store'
import type { RestaurantTable, TableStatus } from '../types'

function useTick(intervalMs: number) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}

function getElapsedMinutes(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000))
}

const STATUS_COLOR: Record<TableStatus, string> = {
  FREE:     '#22c55e',
  OCCUPIED: '#e8612c',
  RESERVED: '#f59e0b',
  BILL:     '#3b82f6',
}
const STATUS_BG: Record<TableStatus, string> = {
  FREE:     'rgba(34,197,94,0.10)',
  OCCUPIED: 'rgba(232,97,44,0.10)',
  RESERVED: 'rgba(245,158,11,0.10)',
  BILL:     'rgba(59,130,246,0.10)',
}
const STATUS_LABEL: Record<TableStatus, string> = {
  FREE:     'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  BILL:     'Awaiting Bill',
}

// Fixed icon canvas — every table renders into the same box so cards line up perfectly.
const VB_W = 160
const VB_H = 120
const CX   = 80
const CY   = 60
const SEAT_OFF = 15
const CS   = 22 // chair size
const CSH  = CS / 2

const TABLE_DIMS: Record<number, { w: number; h: number }> = {
  2: { w: 48, h: 44 },
  4: { w: 66, h: 46 },
  6: { w: 92, h: 54 },
}

function getChairPositions(seats: number, tableW: number, tableH: number) {
  const positions: { x: number; y: number; angle: number }[] = []
  if (seats === 2) {
    positions.push({ x: CX, y: CY - tableH / 2 - SEAT_OFF, angle: 0 })
    positions.push({ x: CX, y: CY + tableH / 2 + SEAT_OFF, angle: 180 })
  } else if (seats === 4) {
    positions.push({ x: CX,                    y: CY - tableH / 2 - SEAT_OFF, angle: 0   })
    positions.push({ x: CX,                    y: CY + tableH / 2 + SEAT_OFF, angle: 180 })
    positions.push({ x: CX - tableW / 2 - SEAT_OFF, y: CY,                    angle: 270 })
    positions.push({ x: CX + tableW / 2 + SEAT_OFF, y: CY,                    angle: 90  })
  } else if (seats === 6) {
    positions.push({ x: CX - 22, y: CY - tableH / 2 - SEAT_OFF, angle: 0   })
    positions.push({ x: CX + 22, y: CY - tableH / 2 - SEAT_OFF, angle: 0   })
    positions.push({ x: CX - 22, y: CY + tableH / 2 + SEAT_OFF, angle: 180 })
    positions.push({ x: CX + 22, y: CY + tableH / 2 + SEAT_OFF, angle: 180 })
    positions.push({ x: CX - tableW / 2 - SEAT_OFF, y: CY,                angle: 270 })
    positions.push({ x: CX + tableW / 2 + SEAT_OFF, y: CY,                angle: 90  })
  }
  return positions
}

function TableIcon({ table }: { table: RestaurantTable }) {
  const color   = STATUS_COLOR[table.status]
  const occupied = table.status !== 'FREE'
  const isBar   = table.id.startsWith('b') || table.label.startsWith('B')
  const { w: tableW, h: tableH } = TABLE_DIMS[table.seats] || TABLE_DIMS[4]
  const chairs  = getChairPositions(table.seats, tableW, tableH)
  const frameId = `frame-t${table.id}`
  const topId   = `top-t${table.id}`

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={frameId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a32" />
          <stop offset="100%" stopColor="#16161a" />
        </linearGradient>
        <linearGradient id={topId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#28282f" />
          <stop offset="55%" stopColor="#1f1f25" />
          <stop offset="100%" stopColor="#19191e" />
        </linearGradient>
      </defs>

      {/* Contact shadow */}
      <ellipse cx={CX} cy={CY + tableH / 2 + (isBar ? tableH / 2 : 0) - 1} rx={tableW / 2 + 6} ry="6" fill="black" opacity="0.25" />

      {/* Chairs */}
      {chairs.map((ch, i) => (
        <g key={i} transform={`translate(${ch.x - CSH}, ${ch.y - CSH}) rotate(${ch.angle}, ${CSH}, ${CSH})`}>
          <ellipse cx={CSH} cy={CSH + 3.5} rx={CSH - 1} ry={CSH - 5} fill="black" opacity="0.28" />
          {/* Backrest */}
          <rect x="3" y="0" width={CS - 6} height="6" rx="3" fill={color} opacity={occupied ? 0.95 : 0.45} />
          <rect x="4.5" y="0.5" width={CS - 9} height="1.5" rx="0.75" fill="white" opacity="0.15" />
          {/* Armrests */}
          <rect x="0.5" y="6.5" width="3" height="11" rx="1.5" fill={color} opacity={occupied ? 0.7 : 0.35} />
          <rect x={CS - 3.5} y="6.5" width="3" height="11" rx="1.5" fill={color} opacity={occupied ? 0.7 : 0.35} />
          {/* Seat cushion */}
          <rect x="2.5" y="4" width={CS - 5} height={CS - 6} rx="4"
            fill={occupied ? color : '#2b2b34'} opacity={occupied ? 0.85 : 1}
            stroke={color} strokeWidth="1"
          />
          {/* Seat highlight */}
          <rect x="4.5" y="6" width={CS - 9} height={CS - 10} rx="2.5" fill="white" opacity="0.08" />
        </g>
      ))}

      {/* Table surface */}
      {isBar ? (
        <>
          <circle cx={CX} cy={CY} r={tableW / 2} fill={`url(#${frameId})`} stroke={color} strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={tableW / 2 - 4.5} fill={`url(#${topId})`} />
          <circle cx={CX} cy={CY} r={tableW / 2 - 11} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
          <ellipse cx={CX - tableW * 0.16} cy={CY - tableW * 0.18} rx={tableW * 0.32} ry={tableW * 0.16}
            fill="white" opacity="0.05" transform={`rotate(-25 ${CX} ${CY})`}
          />
        </>
      ) : (
        <>
          <rect x={CX - tableW / 2} y={CY - tableH / 2} width={tableW} height={tableH} rx="9" fill={`url(#${frameId})`} stroke={color} strokeWidth="1.5" />
          <rect x={CX - tableW / 2 + 4} y={CY - tableH / 2 + 4} width={tableW - 8} height={tableH - 8} rx="6" fill={`url(#${topId})`} />
          <path d={`M ${CX - tableW / 2 + 9} ${CY - tableH / 2 + 4.5} H ${CX + tableW / 2 - 9}`} stroke="white" strokeWidth="1" opacity="0.05" strokeLinecap="round" />
          {table.seats >= 4 && (
            <rect x={CX - tableW / 2 + 9} y={CY - tableH / 2 + 9} width={tableW - 18} height={tableH - 18} rx="4"
              fill="none" stroke={color} strokeWidth="0.6" opacity="0.14" strokeDasharray="2 3"
            />
          )}
          {[0.22, 0.5, 0.78].map((ratio, i) => (
            <line key={i}
              x1={CX - tableW / 2 + 6 + (tableW - 12) * ratio} y1={CY - tableH / 2 + 5}
              x2={CX - tableW / 2 + 6 + (tableW - 12) * ratio} y2={CY + tableH / 2 - 5}
              stroke={color} strokeWidth="0.4" opacity="0.12"
            />
          ))}
        </>
      )}
    </svg>
  )
}

function TableCard({ table, selected, elapsedMins, manageMode, onClick, onDelete }: {
  table: RestaurantTable
  selected: boolean
  elapsedMins: number | null
  manageMode: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const color  = STATUS_COLOR[table.status]
  const isLong = elapsedMins !== null && elapsedMins >= 60
  const isWarn = elapsedMins !== null && elapsedMins >= 30

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 6,
        background: 'var(--s1)', borderRadius: 12, padding: '10px 12px 10px',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--b1)'}`,
        boxShadow: selected ? '0 0 0 3px rgba(232,97,44,0.14)' : 'none',
        cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s, transform .12s',
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--b3)' }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--b1)' }}
    >
      {manageMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title={`Remove ${table.label}`}
          style={{
            position: 'absolute', top: -8, right: -8, zIndex: 2,
            width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--red)',
            background: 'var(--red-bg)', color: 'var(--red)', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1,
          }}
        >
          ×
        </button>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>{table.label}</span>
        </div>
        {elapsedMins !== null && (
          <span style={{
            padding: '2px 7px', borderRadius: 8, fontSize: 10.5, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
            background: isLong ? 'var(--red-bg)' : isWarn ? 'var(--amber-bg)' : 'var(--s2)',
            color: isLong ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--t2)',
            border: `1px solid ${isLong ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--b2)'}`,
          }}>
            {elapsedMins}m
          </span>
        )}
      </div>

      {/* Icon */}
      <div style={{ height: 92 }}>
        <TableIcon table={table} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--t3)' }}>{table.seats} seats</span>
        <span style={{ color, fontWeight: 600 }}>{STATUS_LABEL[table.status]}</span>
      </div>
    </div>
  )
}

function tableSortKey(label: string): [string, number] {
  const m = label.match(/^(\D*)(\d*)$/)
  return [m?.[1] ?? label, parseInt(m?.[2] || '0', 10)]
}

export default function TablesView() {
  const tables            = useStore((s) => s.tables)
  const orders            = useStore((s) => s.orders)
  const currentStaff      = useStore((s) => s.currentStaff)
  const updateTableStatus = useStore((s) => s.updateTableStatus)
  const createTable       = useStore((s) => s.createTable)
  const updateTable       = useStore((s) => s.updateTable)
  const deleteTable       = useStore((s) => s.deleteTable)
  const loadTables        = useStore((s) => s.loadTables)
  const setView           = useStore((s) => s.setView)
  const setOrderTable     = useStore((s) => s.setOrderTable)
  const showToast         = useStore((s) => s.showToast)
  const [selected, setSelected] = useState<string | null>(null)
  const [manageMode, setManageMode] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newSeats, setNewSeats] = useState(4)
  const [editLabel, setEditLabel] = useState('')
  const [editSeats, setEditSeats] = useState(4)
  useTick(30000) // refresh elapsed-time badges every 30s

  const canManage = currentStaff?.role === 'ADMIN' || currentStaff?.role === 'MANAGER'

  const selectedTable = tables.find((t) => t.id === selected)
  const statusCounts  = tables.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<TableStatus, number>)

  function activeOrderFor(table: RestaurantTable) {
    return table.activeOrderId ? orders.find((o) => o.id === table.activeOrderId) : undefined
  }

  const selectedOrder = selectedTable ? activeOrderFor(selectedTable) : undefined
  const selectedOrderTotal = selectedOrder
    ? selectedOrder.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) - selectedOrder.discount
    : 0
  const selectedOrderItems = selectedOrder
    ? selectedOrder.lines.reduce((s, l) => s + l.quantity, 0)
    : 0

  async function handleSetStatus(status: TableStatus) {
    if (!selected || !selectedTable) return
    await updateTableStatus(parseInt(selected), status)
    showToast(`Table ${selectedTable.label} — ${STATUS_LABEL[status]}`)
  }

  function handleAssignOrder() {
    if (!selectedTable) return
    setOrderTable(parseInt(selectedTable.id), selectedTable.label)
    setView('pos')
    showToast(`Table ${selectedTable.label} assigned`)
  }

  function selectTable(id: string) {
    setSelected((cur) => (cur === id ? null : id))
    const t = tables.find((tb) => tb.id === id)
    if (t) { setEditLabel(t.label); setEditSeats(t.seats) }
  }

  function toggleManageMode() {
    setManageMode((m) => !m)
    setShowAddForm(false)
    setSelected(null)
  }

  async function handleAddTable() {
    const label = newLabel.trim()
    if (!label) { showToast('Enter a table name'); return }
    try {
      await createTable({ label, seats: newSeats, posX: 0, posY: 0 })
      showToast(`Table ${label} added`)
      setNewLabel('')
      setNewSeats(4)
      setShowAddForm(false)
    } catch (e: any) {
      showToast(e.message || 'Failed to add table')
    }
  }

  async function handleSaveTable() {
    if (!selectedTable) return
    const label = editLabel.trim()
    if (!label) { showToast('Table name cannot be empty'); return }
    try {
      await updateTable(parseInt(selectedTable.id), { label, seats: editSeats })
      showToast(`Table ${label} updated`)
    } catch (e: any) {
      showToast(e.message || 'Failed to update table')
    }
  }

  async function handleDeleteTable(table: RestaurantTable) {
    if (!window.confirm(`Remove table ${table.label}? This cannot be undone.`)) return
    try {
      await deleteTable(parseInt(table.id))
      showToast(`Table ${table.label} removed`)
    } catch (e: any) {
      showToast(e.message || 'Failed to remove table')
    }
  }

  const sorted = [...tables].sort((a, b) => {
    const [pa, na] = tableSortKey(a.label)
    const [pb, nb] = tableSortKey(b.label)
    return pa !== pb ? pa.localeCompare(pb) : na - nb
  })
  const isBar = (t: RestaurantTable) => t.id.startsWith('b') || t.label.startsWith('B')
  const diningTables = sorted.filter((t) => !isBar(t))
  const barTables    = sorted.filter(isBar)

  function renderGrid(list: RestaurantTable[]) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 14 }}>
        {list.map((table) => {
          const order = activeOrderFor(table)
          const elapsedMins = (table.status === 'OCCUPIED' || table.status === 'BILL') && order
            ? getElapsedMinutes(order.createdAt)
            : null
          return (
            <TableCard
              key={table.id}
              table={table}
              selected={selected === table.id}
              elapsedMins={elapsedMins}
              manageMode={manageMode}
              onClick={() => selectTable(table.id)}
              onDelete={() => handleDeleteTable(table)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Floor plan */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Tables</span>
          <div style={{ display: 'flex', gap: 18 }}>
            {(Object.keys(STATUS_LABEL) as TableStatus[]).map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: STATUS_COLOR[s] }} />
                {STATUS_LABEL[s]}
                <span style={{ color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>({statusCounts[s] || 0})</span>
              </div>
            ))}
          </div>
          {canManage && (
            <button onClick={toggleManageMode} style={{
              marginLeft: 'auto', padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${manageMode ? 'var(--accent)' : 'var(--b2)'}`,
              background: manageMode ? 'var(--accent)' : 'var(--s2)',
              color: manageMode ? 'white' : 'var(--t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {manageMode ? '✓ Done Editing' : '✎ Manage Tables'}
            </button>
          )}
          {manageMode && (
            <button onClick={() => setShowAddForm((v) => !v)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>
              + Add Table
            </button>
          )}
          <button onClick={() => loadTables()} style={{ marginLeft: canManage ? 0 : 'auto', padding: '5px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>

        {/* Add table form */}
        {manageMode && showAddForm && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s2)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>New table:</span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. T12 or B2"
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s1)', color: 'var(--t1)', fontSize: 13, width: 140 }}
            />
            <select
              value={newSeats}
              onChange={(e) => setNewSeats(parseInt(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s1)', color: 'var(--t1)', fontSize: 13 }}
            >
              <option value={2}>2 seats</option>
              <option value={4}>4 seats</option>
              <option value={6}>6 seats</option>
            </select>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Tip: name starting with "B" shows as a round bar table</span>
            <button onClick={handleAddTable} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Add
            </button>
            <button onClick={() => setShowAddForm(false)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t2)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {manageMode && (
          <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--b1)', background: 'rgba(232,97,44,0.06)', fontSize: 12, color: 'var(--amber)' }}>
            Editing is on — click a table to rename it or change its seats, or click × to remove it.
          </div>
        )}

        {/* Grid */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', padding: 20 }}>
          {tables.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', color: 'var(--t3)' }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>📍 No tables loaded</div>
                <button onClick={() => loadTables()} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>
                  Load Tables
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Dining Room
              </div>
              {renderGrid(diningTables)}

              {barTables.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '20px 0 10px' }}>
                    Bar
                  </div>
                  {renderGrid(barTables)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side panel */}
      <div style={{ width: 268, background: 'var(--s1)', borderLeft: '1px solid var(--b1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Table Details</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            {selectedTable ? `${selectedTable.label} — ${selectedTable.seats} seats` : 'Select a table'}
          </div>
        </div>

        {selectedTable ? (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
              borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: STATUS_BG[selectedTable.status],
              color: STATUS_COLOR[selectedTable.status],
              border: `1px solid ${STATUS_COLOR[selectedTable.status]}40`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[selectedTable.status] }} />
              {STATUS_LABEL[selectedTable.status]}
            </div>

            {/* Edit table (manage mode) */}
            {manageMode && (
              <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Edit Table</div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--t3)' }}>
                  Name
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13 }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--t3)' }}>
                  Seats
                  <select
                    value={editSeats}
                    onChange={(e) => setEditSeats(parseInt(e.target.value))}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t1)', fontSize: 13 }}
                  >
                    <option value={2}>2 seats</option>
                    <option value={4}>4 seats</option>
                    <option value={6}>6 seats</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSaveTable} style={{ flex: 1, padding: '8px 11px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => handleDeleteTable(selectedTable)} style={{ padding: '8px 11px', borderRadius: 7, border: '1px solid var(--red)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Active order summary */}
            {selectedOrder && (
              <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Active Order</div>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--t2)' }}>Order #{selectedOrder.id}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--green)' }}>{formatCents(selectedOrderTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t3)' }}>
                    <span>{selectedOrderItems} item{selectedOrderItems !== 1 ? 's' : ''}</span>
                    <span>Open {getElapsedMinutes(selectedOrder.createdAt)}m</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 2 }}>Change Status</div>
              {(Object.keys(STATUS_LABEL) as TableStatus[]).filter((s) => s !== selectedTable.status).map((s) => (
                <button key={s} onClick={() => handleSetStatus(s)} style={{
                  padding: '8px 11px', borderRadius: 7, border: `1px solid ${STATUS_COLOR[s]}30`,
                  background: STATUS_BG[s], color: STATUS_COLOR[s], fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: 500,
                }}>
                  Mark {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10 }}>
              <button onClick={handleAssignOrder} style={{
                width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                {selectedOrder ? 'Add Items to Order' : 'Open New Order'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 20, color: 'var(--t3)', fontSize: 13, lineHeight: 1.6 }}>
            Click any table to view details and manage orders.
          </div>
        )}

        {/* Summary */}
        <div style={{ marginTop: 'auto', padding: '14px 16px', borderTop: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Total',    value: tables.length },
              { label: 'Occupied', value: statusCounts['OCCUPIED'] || 0 },
              { label: 'Free',     value: statusCounts['FREE'] || 0 },
              { label: 'Reserved', value: statusCounts['RESERVED'] || 0 },
            ].map((stat) => (
              <div key={stat.label} style={{ background: 'var(--s2)', borderRadius: 8, padding: '9px 11px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
