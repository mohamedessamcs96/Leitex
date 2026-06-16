import { useState, useEffect } from 'react'
import { useStore, formatCents, getDraftSubtotal } from '../store'
import type { MenuCategory } from '../types'
import ModifierModal from './ModifierModal'
import PaymentModal from './PaymentModal'

function ChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
}
function TrashIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
function SendIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
}
function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
}
function TagIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>
}

export default function POSView() {
  const [activeCat, setActiveCat]       = useState<string>('ALL')
  const [search, setSearch]             = useState('')
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [discountInput, setDiscountInput] = useState('')

  const menuCategories = useStore((s) => s.menuCategories)
  const menuLoading    = useStore((s) => s.menuLoading)
  const draft          = useStore((s) => s.draftOrder)
  const addLine        = useStore((s) => s.addLine)
  const removeLine     = useStore((s) => s.removeLine)
  const updateQty      = useStore((s) => s.updateQty)
  const setDiscount    = useStore((s) => s.setDiscount)
  const submitOrder    = useStore((s) => s.submitOrder)
  const showToast      = useStore((s) => s.showToast)
  const setPayModal    = useStore((s) => s.setPayModal)
  const showPayModal   = useStore((s) => s.showPayModal)
  const tables         = useStore((s) => s.tables)
  const setOrderTable  = useStore((s) => s.setOrderTable)
  const setModifierItem = useStore((s) => s.setModifierItem)
  const modifierMenuItemId = useStore((s) => s.modifierMenuItemId)
  const clearDraft     = useStore((s) => s.clearDraft)

  // Flatten all items from categories
  const allItems = menuCategories.flatMap((c: any) =>
    (c.items || []).map((i: any) => ({ ...i, categoryName: c.name, categoryColor: c.color }))
  )

  const filteredItems = allItems.filter((item: any) => {
    if (!item.is_available) return false
    if (activeCat !== 'ALL' && String(item.category) !== String(activeCat)) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const subtotal  = getDraftSubtotal(draft.lines)
  const total     = Math.max(0, subtotal - draft.discount)
  const lineCount = draft.lines.reduce((s, l) => s + l.quantity, 0)

  function handleItemClick(item: any) {
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      setModifierItem(String(item.id))
    } else {
      addLine({
        menuItemId: String(item.id),
        name:       item.name,
        quantity:   1,
        unitPrice:  item.price,
        modOptions: [],
        station:    item.station,
      })
      showToast(`${item.name} added`)
    }
  }

  function handleApplyDiscount(pct: number) {
    const disc = Math.round(subtotal * pct / 100)
    setDiscount(disc)
    setDiscountInput((disc / 100).toFixed(2))
  }

  function handleDiscountInput(val: string) {
    setDiscountInput(val)
    const cents = Math.round(parseFloat(val || '0') * 100)
    setDiscount(isNaN(cents) ? 0 : cents)
  }

  async function handleSendToKitchen() {
    if (draft.lines.length === 0) return showToast('Add items before sending to kitchen')
    if (!draft.tableId) return showToast('⚠️ Please select a table first')
    await submitOrder()
  }

  const selectedTable = tables.find((t) => t.id === String(draft.tableId))

  const catTabs = [
    { id: 'ALL', name: 'All Items', color: '#6b7280' },
    ...menuCategories.map((c: any) => ({ id: String(c.id), name: c.name, color: c.color })),
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Menu Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--b1)' }}>
        {/* Topbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--s1)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 34, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 8, color: 'var(--t1)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div
            onClick={() => setShowTableMenu(!showTableMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 34,
              background: selectedTable ? 'var(--amber-bg)' : 'var(--red-bg)',
              border: `1px solid ${selectedTable ? 'var(--amber)' : 'var(--red)'}`,
              borderRadius: 8, cursor: 'pointer',
              color: selectedTable ? 'var(--amber)' : 'var(--red)',
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', position: 'relative',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M7 12v5M17 12v5M5 17h14"/></svg>
            {selectedTable ? selectedTable.label : '⚠ Select Table'}
            <ChevronDown />

            {/* Table dropdown */}
            {showTableMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 8, zIndex: 1000, maxHeight: 300, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '8px' }}>
                  {tables.map((t) => (
                    <button key={t.id} onClick={() => { setOrderTable(parseInt(t.id), t.label); setShowTableMenu(false) }}
                      style={{
                        width: '100%', padding: '8px 12px', textAlign: 'left', borderRadius: 6, border: 'none',
                        background: selectedTable?.id === t.id ? 'var(--amber-bg)' : 'transparent',
                        color: selectedTable?.id === t.id ? 'var(--amber)' : 'var(--t2)',
                        fontSize: 12, cursor: 'pointer', fontWeight: selectedTable?.id === t.id ? 600 : 400,
                        display: 'flex', justifyContent: 'space-between',
                      }}>
                      <span>{t.label} — {t.seats} seats</span>
                      <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 8 }}>{t.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 16px 8px', background: 'var(--s1)', borderBottom: '1px solid var(--b1)', overflowX: 'auto', flexShrink: 0 }}>
          {catTabs.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
                background: activeCat === cat.id ? 'var(--accent)' : 'var(--s3)',
                color: activeCat === cat.id ? 'white' : 'var(--t2)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .12s',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Item grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, alignContent: 'start' }}>
          {menuLoading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>Loading menu...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--t3)', paddingTop: 40, fontSize: 13 }}>No items found</div>
          ) : (
            filteredItems.map((item: any) => {
              const inOrder = draft.lines.find((l) => l.menuItemId === String(item.id))
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    background: inOrder ? 'var(--s3)' : 'var(--s2)',
                    border: `1px solid ${inOrder ? 'rgba(232,97,44,0.4)' : 'var(--b2)'}`,
                    borderRadius: 10, padding: '12px 10px 10px', textAlign: 'left',
                    cursor: 'pointer', transition: 'all .12s', position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--accent)'; el.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = inOrder ? 'rgba(232,97,44,0.4)' : 'var(--b2)'; el.style.transform = 'none' }}
                >
                  {inOrder && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--accent)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                      x{inOrder.quantity}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: item.categoryColor || 'var(--accent)', borderRadius: '10px 10px 0 0' }} />
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--t1)', lineHeight: 1.3, marginBottom: 4 }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.4, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {item.description}
                      </div>
                    )}
                    <div className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{formatCents(item.price)}</div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Order Panel */}
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', background: 'var(--s1)', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Current Order</span>
            {lineCount > 0 && <span style={{ background: 'var(--accent)', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{lineCount}</span>}
          </div>
          {draft.lines.length > 0 && (
            <button onClick={() => { clearDraft(); setDiscountInput('') }} style={{ background: 'transparent', border: 'none', color: 'var(--t3)', padding: 4, borderRadius: 4, cursor: 'pointer' }} title="Clear">
              <TrashIcon />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {draft.lines.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--t3)', gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span style={{ fontSize: 12 }}>Tap items to add to order</span>
            </div>
          ) : (
            draft.lines.map((line) => (
              <div key={line.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderRadius: 7, transition: 'background .1s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--s2)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateQty(line.id, -1)} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--b2)', background: 'var(--s3)', color: 'var(--t1)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>-</button>
                  <span className="mono" style={{ fontSize: 12, minWidth: 16, textAlign: 'center' }}>{line.quantity}</span>
                  <button onClick={() => updateQty(line.id, 1)} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--b2)', background: 'var(--s3)', color: 'var(--t1)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>+</button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.name}</div>
                  {line.modOptions.length > 0 && <div style={{ fontSize: 10, color: 'var(--t3)' }}>{line.modOptions.join(', ')}</div>}
                </div>
                <span className="mono" style={{ fontSize: 12, flexShrink: 0 }}>{formatCents(line.unitPrice * line.quantity)}</span>
                <button onClick={() => removeLine(line.id)} style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t3)' }}>
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--b1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--t3)', fontSize: 12 }}>Subtotal</span>
            <span className="mono" style={{ fontSize: 12 }}>{formatCents(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}><TagIcon /></span>
              <input type="number" placeholder="Discount (€)" value={discountInput} onChange={(e) => handleDiscountInput(e.target.value)}
                style={{ width: '100%', height: 30, paddingLeft: 24, paddingRight: 8, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 6, color: 'var(--t1)', fontSize: 12, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            {[10, 15, 20].map((pct) => (
              <button key={pct} onClick={() => handleApplyDiscount(pct)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 11, cursor: 'pointer' }}>{pct}%</button>
            ))}
          </div>
          {draft.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--green)', fontSize: 12 }}>Discount</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--green)' }}>-{formatCents(draft.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--b1)' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Total</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{formatCents(total)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {(['CASH', 'CARD', 'SPLIT'] as const).map((method) => (
              <button key={method} onClick={() => { if (draft.lines.length === 0) return showToast('Add items first'); setPayModal(true) }}
                style={{ height: 36, borderRadius: 7, border: `1px solid`, borderColor: method === 'CASH' ? 'rgba(34,197,94,0.3)' : method === 'CARD' ? 'rgba(59,130,246,0.3)' : 'rgba(168,85,247,0.3)', background: method === 'CASH' ? 'var(--green-bg)' : method === 'CARD' ? 'var(--blue-bg)' : 'var(--purple-bg)', color: method === 'CASH' ? 'var(--green)' : method === 'CARD' ? 'var(--blue)' : 'var(--purple)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                {method}
              </button>
            ))}
          </div>
          <button onClick={handleSendToKitchen} disabled={draft.lines.length === 0 || !draft.tableId}
            style={{ height: 42, borderRadius: 8, border: 'none', background: draft.lines.length > 0 && draft.tableId ? 'var(--accent)' : 'var(--s3)', color: draft.lines.length > 0 && draft.tableId ? 'white' : 'var(--t3)', fontSize: 13, fontWeight: 600, cursor: draft.lines.length > 0 && draft.tableId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, title: draft.tableId ? '' : '⚠️ Select a table first' }}>
            <SendIcon />
            Send to Kitchen
          </button>
        </div>
      </div>

      {modifierMenuItemId && <ModifierModal />}
      {showPayModal && <PaymentModal total={total} />}
    </div>
  )
}
