import { useState } from 'react'
import { useStore, formatCents } from '../store'

export default function ModifierModal() {
  const modifierMenuItemId = useStore((s) => s.modifierMenuItemId)
  const setModifierItem    = useStore((s) => s.setModifierItem)
  const addLine            = useStore((s) => s.addLine)
  const showToast          = useStore((s) => s.showToast)
  const menuCategories     = useStore((s) => s.menuCategories)

  const [selected, setSelected] = useState<Record<string, string>>({})

  // Find item in menu categories
  const item = menuCategories
    .flatMap((c: any) => c.items || [])
    .find((i: any) => String(i.id) === modifierMenuItemId)

  if (!item) return null

  const modifierGroups: any[] = item.modifier_groups || []

  const totalAdj = Object.values(selected).reduce((sum, optId) => {
    for (const group of modifierGroups) {
      const opt = (group.options || []).find((o: any) => String(o.id) === optId)
      if (opt) return sum + opt.price_adj
    }
    return sum
  }, 0)

  function handleConfirm() {
    const modLabels = Object.values(selected).map((optId) => {
      for (const group of modifierGroups) {
        const opt = (group.options || []).find((o: any) => String(o.id) === optId)
        if (opt) return opt.label
      }
      return ''
    }).filter(Boolean)

    addLine({
      menuItemId: String(item.id),
      name:       item.name,
      quantity:   1,
      unitPrice:  item.price + totalAdj,
      modOptions: modLabels,
      station:    item.station,
    })
    showToast(`${item.name} added`)
    setModifierItem(null)
    setSelected({})
  }

  function close() {
    setModifierItem(null)
    setSelected({})
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div style={{ background: 'var(--s1)', borderRadius: 12, width: 400, border: '1px solid var(--b2)', overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>{item.description}</div>
          )}
        </div>

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {modifierGroups.map((group: any) => (
            <div key={group.id}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                {group.name}
                {group.required && (
                  <span style={{ fontSize: 10, color: 'var(--red)', background: 'var(--red-bg)', padding: '1px 6px', borderRadius: 4 }}>
                    Required
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(group.options || []).map((opt: any) => {
                  const isSelected = selected[group.id] === String(opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelected((s) => ({ ...s, [group.id]: String(opt.id) }))}
                      style={{
                        padding: '9px 12px', borderRadius: 7, textAlign: 'left', cursor: 'pointer',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--b2)'}`,
                        background: isSelected ? 'rgba(232,97,44,0.1)' : 'var(--s2)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all .1s',
                      }}
                    >
                      <span style={{ fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--t1)', fontWeight: isSelected ? 500 : 400 }}>
                        {opt.label}
                      </span>
                      {opt.price_adj !== 0 && (
                        <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>
                          +{formatCents(opt.price_adj)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8 }}>
          <button onClick={close} style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t2)', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{ flex: 2, height: 40, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Add — {formatCents(item.price + totalAdj)}
          </button>
        </div>
      </div>
    </div>
  )
}
