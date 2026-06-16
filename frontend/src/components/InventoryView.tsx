import { useState, useEffect } from 'react'
import { inventory } from '../api'
import { formatCents } from '../store'

export default function InventoryView() {
  const [items, setItems]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [editing, setEditing]   = useState<number | null>(null)
  const [editVal, setEditVal]   = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await inventory.ingredients()
      setItems(Array.isArray(data) ? data : (data.results || []))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStock(id: number, stock: number) {
    try {
      const updated = await inventory.update(id, { stock })
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, stock: updated.stock } : i))
      setEditing(null)
    } catch {}
  }

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  )
  const lowCount = items.filter((i) => i.is_low).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Inventory</span>
        {lowCount > 0 && (
          <div style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--red-bg)', color: 'var(--red)', fontSize: 11, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' }}>
            {lowCount} Low Stock Alert{lowCount !== 1 ? 's' : ''}
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <input
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: 32, padding: '0 12px', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 7, color: 'var(--t1)', fontSize: 12, outline: 'none', width: 200 }}
          />
          <button onClick={load} style={{ padding: '0 12px', height: 32, borderRadius: 7, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 60 }}>Loading inventory...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr>
                {['Ingredient', 'Current Stock', 'Unit', 'Low Alert At', 'Status', 'Cost / Unit', 'Supplier', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow      = item.is_low
                const isCritical = item.stock <= item.low_stock_at * 0.5
                return (
                  <tr
                    key={item.id}
                    style={{ background: 'var(--s1)', cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--s2)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--s1)'}
                  >
                    <td style={{ padding: '10px 12px', borderRadius: '8px 0 0 8px', fontWeight: 500, fontSize: 13 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {editing === item.id ? (
                        <input
                          autoFocus
                          type="number"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={() => handleUpdateStock(item.id, parseFloat(editVal))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateStock(item.id, parseFloat(editVal))
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          style={{ width: 70, padding: '2px 6px', background: 'var(--s3)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--t1)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
                        />
                      ) : (
                        <span
                          className="mono"
                          style={{ fontSize: 13, color: isCritical ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--t1)', cursor: 'pointer' }}
                          onClick={() => { setEditing(item.id); setEditVal(String(item.stock)) }}
                          title="Click to edit"
                        >
                          {item.stock}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--t3)', fontSize: 12 }}>{item.unit}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--t3)' }}>{item.low_stock_at}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: isCritical ? 'var(--red-bg)' : isLow ? 'var(--amber-bg)' : 'var(--green-bg)',
                        color: isCritical ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--green)',
                      }}>
                        {isCritical ? 'Critical' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--t2)' }}>
                      €{parseFloat(item.cost_per_unit).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--t3)' }}>{item.supplier}</td>
                    <td style={{ padding: '10px 12px', borderRadius: '0 8px 8px 0' }}>
                      <button
                        onClick={() => { setEditing(item.id); setEditVal(String(item.stock)) }}
                        style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t2)', fontSize: 11, cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>
            {items.length === 0 ? 'No inventory items yet. Run python manage.py seed to add demo data.' : 'No items match your search.'}
          </div>
        )}
      </div>
    </div>
  )
}
