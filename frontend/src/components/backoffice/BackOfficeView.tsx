import { useState, useEffect, useCallback } from 'react'
import { analytics, orders as ordersApi, tables as tablesApi, adminApi } from '../../api'
import { formatCents, useStore } from '../../store'

// ── Shared primitives ─────────────────────────────────────────────────────────

const iStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--s2)',
  border: '1px solid var(--b2)', borderRadius: 6, color: 'var(--t1)',
  fontSize: 13, outline: 'none',
}

function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      <input {...p} style={{ ...iStyle, ...p.style }} />
    </div>
  )
}

function Sel({ label, children, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      <select {...p} style={iStyle as any}>{children}</select>
    </div>
  )
}

function Modal({ title, onClose, onSave, busy, children }: {
  title: string; onClose: () => void; onSave: () => void; busy?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 12, width: 500, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--b1)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '7px 18px', borderRadius: 7, border: '1px solid var(--b2)', background: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={onSave} disabled={busy} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddBtn({ onClick, label = 'Add' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
      + {label}
    </button>
  )
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--b2)', background: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 11 }}>Edit</button>
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--red-bg)', background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>Delete</button>
}

function PanelHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  )
}

function StatCard({ label, value, sub, color = 'var(--t1)' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

const SECTIONS = ['Overview', 'Staff', 'Menu', 'Tables', 'Restaurants', 'Orders']

export default function BackOfficeView() {
  const [section, setSection] = useState('Overview')
  const [dash, setDash]       = useState<any>(null)
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
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Admin Panel</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Manage your restaurant</div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 24, flexWrap: 'wrap' }}>
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
        {section === 'Overview'     && <OverviewPanel dash={dash} sessionRev={sessionRev} sessionPaid={sessionPaid} orders={orders} recentOrders={recentOrders} />}
        {section === 'Staff'        && <StaffPanel />}
        {section === 'Menu'         && <MenuPanel />}
        {section === 'Tables'       && <TablesPanel />}
        {section === 'Restaurants'  && <RestaurantsPanel />}
        {section === 'Orders'       && <OrdersPanel orders={recentOrders.length > 0 ? recentOrders : orders} />}
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewPanel({ dash, sessionRev, sessionPaid, orders, recentOrders }: any) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Today's Revenue" value={formatCents(dash?.today?.revenue || 0)} sub={`${dash?.today?.order_count || 0} orders`} color="var(--green)" />
        <StatCard label="Session Revenue" value={formatCents(sessionRev)} sub={`${sessionPaid} paid orders`} />
        <StatCard label="Open Tables"     value={String(dash?.open_tables || 0)} sub="currently occupied" color="var(--amber)" />
        <StatCard label="Active Orders"   value={String(orders.filter((o: any) => ['OPEN','SENT','READY'].includes(o.status)).length)} sub="in kitchen or open" color="var(--accent)" />
      </div>

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

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontWeight: 600, fontSize: 13 }}>Recent Orders</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--s2)' }}>
              {['Order','Table','Staff','Status','Total','Time'].map((h) => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentOrders.length > 0 ? recentOrders : orders.slice(0, 15)).map((order: any) => {
              const total  = order.total ?? (order.lines?.reduce((s: number, l: any) => s + l.unit_price * l.quantity, 0) - (order.discount || 0))
              const status = order.status
              const sColor = status === 'PAID' ? 'var(--green)' : status === 'VOIDED' ? 'var(--red)' : status === 'READY' ? 'var(--teal)' : 'var(--amber)'
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--b1)' }}>
                  <td style={{ padding: '9px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>#{order.id}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--t2)' }}>{order.table_label || '—'}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--t2)' }}>{order.staff_name || order.staffName || '—'}</td>
                  <td style={{ padding: '9px 14px' }}><span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${sColor}18`, color: sColor }}>{status}</span></td>
                  <td style={{ padding: '9px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(total || 0)}</td>
                  <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--t3)' }}>{new Date(order.created_at || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {recentOrders.length === 0 && orders.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>No orders yet</div>
        )}
      </div>
    </>
  )
}

// ── Staff Panel ───────────────────────────────────────────────────────────────

const ROLES = ['ADMIN','MANAGER','CASHIER','WAITER','KITCHEN']
const roleColor: Record<string,string> = { ADMIN:'var(--red)', MANAGER:'var(--purple)', CASHIER:'var(--blue)', WAITER:'var(--teal)', KITCHEN:'var(--amber)' }

function StaffPanel() {
  const [list, setList]     = useState<any[]>([])
  const [modal, setModal]   = useState<any>(null)
  const [form, setForm]     = useState<any>({})
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')
  const showToast = useStore((s) => s.showToast)

  const load = useCallback(() => adminApi.staffList().then(setList).catch(() => {}), [])
  useEffect(() => { load() }, [load])

  function openAdd() { setForm({ role: 'WAITER' }); setModal('add'); setErr('') }
  function openEdit(s: any) { setForm({ ...s }); setModal('edit'); setErr('') }

  async function save() {
    if (!form.name?.trim() || !form.pin?.trim()) { setErr('Name and PIN are required.'); return }
    if (modal === 'add' && !form.username?.trim()) { setErr('Username is required.'); return }
    setBusy(true); setErr('')
    try {
      if (modal === 'add') await adminApi.staffCreate(form)
      else await adminApi.staffUpdate(form.id, { name: form.name, role: form.role, pin: form.pin })
      showToast(modal === 'add' ? 'Staff member added' : 'Staff updated')
      setModal(null); load()
    } catch (e: any) { setErr(e.message || 'Error saving') }
    setBusy(false)
  }

  async function del(s: any) {
    if (!confirm(`Delete ${s.name}?`)) return
    try { await adminApi.staffDelete(s.id); showToast('Deleted'); load() } catch {}
  }

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <div>
      <PanelHeader title="Staff Members" sub={`${list.length} members`} action={<AddBtn onClick={openAdd} label="Add Staff" />} />

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--s2)' }}>
              {['Name','Username','Role','PIN','Actions'].map((h) => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--b1)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: roleColor[s.role] || 'var(--t2)', flexShrink: 0 }}>
                      {s.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--t3)' }}>{s.username}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: roleColor[s.role] || 'var(--t2)', background: `${roleColor[s.role] || 'var(--t2)'}18` }}>{s.role}</span>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.1em' }}>{s.pin}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}><EditBtn onClick={() => openEdit(s)} /><DelBtn onClick={() => del(s)} /></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>No staff members yet</div>}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Staff Member' : `Edit ${form.name}`} onClose={() => setModal(null)} onSave={save} busy={busy}>
          {modal === 'add' && <Field label="Username" value={form.username || ''} onChange={(e) => set('username', e.target.value)} placeholder="e.g. john.doe" />}
          <Field label="Full Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. John Doe" />
          <Sel label="Role" value={form.role || 'WAITER'} onChange={(e) => set('role', e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Sel>
          <Field label="PIN (4–10 digits)" value={form.pin || ''} onChange={(e) => set('pin', e.target.value)} placeholder="e.g. 1234" maxLength={10} />
          {err && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: -8 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}

// ── Menu Panel ────────────────────────────────────────────────────────────────

function MenuPanel() {
  const [categories, setCategories] = useState<any[]>([])
  const [modal, setModal]           = useState<null | 'cat-add' | 'cat-edit' | 'item-add' | 'item-edit'>(null)
  const [form, setForm]             = useState<any>({})
  const [busy, setBusy]             = useState(false)
  const [err, setErr]               = useState('')
  const [activeCategory, setActiveCategory] = useState<any>(null)
  const showToast = useStore((s) => s.showToast)

  const load = useCallback(() =>
    adminApi.categoryList().then((cats) => {
      setCategories(cats)
      if (!activeCategory && cats.length > 0) setActiveCategory(cats[0])
    }).catch(() => {}), [])
  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function saveCat() {
    if (!form.name?.trim()) { setErr('Name is required.'); return }
    setBusy(true); setErr('')
    try {
      if (modal === 'cat-add') await adminApi.categoryCreate({ name: form.name, color: form.color || '#3b82f6' })
      else await adminApi.categoryUpdate(form.id, { name: form.name, color: form.color })
      showToast(modal === 'cat-add' ? 'Category added' : 'Category updated')
      setModal(null); load()
    } catch (e: any) { setErr(e.message || 'Error') }
    setBusy(false)
  }

  async function delCat(cat: any) {
    if (!confirm(`Delete category "${cat.name}" and all its items?`)) return
    try { await adminApi.categoryDelete(cat.id); showToast('Category deleted'); load() } catch {}
  }

  async function saveItem() {
    if (!form.name?.trim() || !form.price) { setErr('Name and price are required.'); return }
    setBusy(true); setErr('')
    try {
      const priceInCents = Math.round(parseFloat(form.price) * 100)
      const catId = form.category_id || activeCategory?.id
      if (modal === 'item-add') await adminApi.itemCreate({ category: catId, name: form.name, price: priceInCents, description: form.description || '', station: form.station || 'kitchen' })
      else await adminApi.itemUpdate(form.id, { name: form.name, price: priceInCents, description: form.description || '', station: form.station || 'kitchen', category: catId })
      showToast(modal === 'item-add' ? 'Item added' : 'Item updated')
      setModal(null); load()
    } catch (e: any) { setErr(e.message || 'Error') }
    setBusy(false)
  }

  async function delItem(item: any) {
    if (!confirm(`Delete "${item.name}"?`)) return
    try { await adminApi.itemDelete(item.id); showToast('Item deleted'); load() } catch {}
  }

  const selectedCat = categories.find((c) => c.id === activeCategory?.id) || categories[0]
  const items = selectedCat?.items || []

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Left: Categories */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <PanelHeader title="Categories" action={<AddBtn onClick={() => { setForm({ color: '#3b82f6' }); setModal('cat-add'); setErr('') }} label="Add" />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categories.map((cat) => (
            <div key={cat.id} onClick={() => setActiveCategory(cat)} style={{
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: activeCategory?.id === cat.id ? 'var(--s3)' : 'var(--s1)',
              border: `1px solid ${activeCategory?.id === cat.id ? 'var(--b2)' : 'var(--b1)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{(cat.items || []).length}</div>
            </div>
          ))}
          {categories.length === 0 && <div style={{ fontSize: 12, color: 'var(--t3)', padding: '12px 4px' }}>No categories yet</div>}
        </div>
      </div>

      {/* Right: Items */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedCat ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedCat.color }} />
                  {selectedCat.name}
                  <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}>{items.length} items</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setForm({ ...selectedCat }); setModal('cat-edit'); setErr('') }}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 12 }}>Edit Category</button>
                <button onClick={() => delCat(selectedCat)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--red-bg)', background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                <AddBtn onClick={() => { setForm({ station: 'kitchen', price: '' }); setModal('item-add'); setErr('') }} label="Add Item" />
              </div>
            </div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--s2)' }}>
                    {['Name','Description','Price','Station','Available','Actions'].map((h) => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--b1)', opacity: item.is_available ? 1 : 0.5 }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--t3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>{formatCents(item.price)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--t3)', textTransform: 'capitalize' }}>{item.station}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: item.is_available ? 'var(--green-bg)' : 'var(--s3)', color: item.is_available ? 'var(--green)' : 'var(--t3)' }}>
                          {item.is_available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <EditBtn onClick={() => { setForm({ ...item, price: (item.price / 100).toFixed(2), category_id: selectedCat.id }); setModal('item-edit'); setErr('') }} />
                          <DelBtn onClick={() => delItem(item)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>No items in this category yet</div>}
            </div>
          </>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>Select or create a category to manage items</div>
        )}
      </div>

      {/* Category modal */}
      {(modal === 'cat-add' || modal === 'cat-edit') && (
        <Modal title={modal === 'cat-add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)} onSave={saveCat} busy={busy}>
          <Field label="Category Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Starters" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.color || '#3b82f6'} onChange={(e) => set('color', e.target.value)} style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--b2)', cursor: 'pointer', padding: 2 }} />
              <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'monospace' }}>{form.color || '#3b82f6'}</span>
            </div>
          </div>
          {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>}
        </Modal>
      )}

      {/* Item modal */}
      {(modal === 'item-add' || modal === 'item-edit') && (
        <Modal title={modal === 'item-add' ? `Add Item to ${selectedCat?.name}` : `Edit "${form.name}"`} onClose={() => setModal(null)} onSave={saveItem} busy={busy}>
          <Field label="Item Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Margherita Pizza" />
          <Field label="Price (€)" type="number" step="0.01" min="0" value={form.price || ''} onChange={(e) => set('price', e.target.value)} placeholder="e.g. 12.50" />
          <Field label="Description (optional)" value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Short description" />
          <Sel label="Station" value={form.station || 'kitchen'} onChange={(e) => set('station', e.target.value)}>
            <option value="kitchen">Kitchen</option>
            <option value="bar">Bar</option>
            <option value="any">Any</option>
          </Sel>
          {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}

// ── Tables Panel ──────────────────────────────────────────────────────────────

function TablesPanel() {
  const [list, setList]   = useState<any[]>([])
  const [modal, setModal] = useState<any>(null)
  const [form, setForm]   = useState<any>({})
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')
  const showToast = useStore((s) => s.showToast)

  const load = useCallback(() => tablesApi.list().then((d: any) => setList(Array.isArray(d) ? d : d.results || [])).catch(() => {}), [])
  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function save() {
    if (!form.label?.trim()) { setErr('Label is required.'); return }
    setBusy(true); setErr('')
    try {
      const data = { label: form.label, seats: parseInt(form.seats) || 4, zone: form.zone || 'Main', pos_x: 0, pos_y: 0 }
      if (modal === 'add') await tablesApi.create(data)
      else await tablesApi.update(form.id, data)
      showToast(modal === 'add' ? 'Table added' : 'Table updated')
      setModal(null); load()
    } catch (e: any) { setErr(e.message || 'Error') }
    setBusy(false)
  }

  async function del(t: any) {
    if (!confirm(`Delete table ${t.label}?`)) return
    try { await tablesApi.remove(t.id); showToast('Table deleted'); load() } catch {}
  }

  const zones = [...new Set(list.map((t) => t.zone || 'Main'))]

  const statusColor: Record<string,string> = { FREE: 'var(--green)', OCCUPIED: 'var(--amber)', RESERVED: 'var(--blue)', BILL: 'var(--red)' }

  return (
    <div>
      <PanelHeader title="Tables" sub={`${list.length} tables across ${zones.length} zone(s)`} action={<AddBtn onClick={() => { setForm({ seats: 4, zone: 'Main' }); setModal('add'); setErr('') }} label="Add Table" />} />

      {zones.map((zone) => (
        <div key={zone} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>{zone}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {list.filter((t) => (t.zone || 'Main') === zone).map((t) => (
              <div key={t.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'JetBrains Mono, monospace' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t.seats} seats</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: statusColor[t.status] || 'var(--t2)', background: `${statusColor[t.status] || 'var(--t2)'}18` }}>{t.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <EditBtn onClick={() => { setForm({ ...t }); setModal('edit'); setErr('') }} />
                  <DelBtn onClick={() => del(t)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {list.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>No tables yet. Click "Add Table" to create one.</div>}

      {modal && (
        <Modal title={modal === 'add' ? 'Add Table' : `Edit Table ${form.label}`} onClose={() => setModal(null)} onSave={save} busy={busy}>
          <Field label="Table Label" value={form.label || ''} onChange={(e) => set('label', e.target.value)} placeholder="e.g. T1, A2, Terrace-1" />
          <Field label="Number of Seats / Chairs" type="number" min="1" max="50" value={form.seats || 4} onChange={(e) => set('seats', e.target.value)} />
          <Field label="Zone" value={form.zone || 'Main'} onChange={(e) => set('zone', e.target.value)} placeholder="e.g. Main, Terrace, Bar" />
          {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}

// ── Restaurants Panel ─────────────────────────────────────────────────────────

function RestaurantsPanel() {
  const [list, setList]   = useState<any[]>([])
  const [modal, setModal] = useState<any>(null)
  const [form, setForm]   = useState<any>({})
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')
  const showToast = useStore((s) => s.showToast)

  const load = useCallback(() => adminApi.locationList().then(setList).catch(() => {}), [])
  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { setErr('Restaurant name is required.'); return }
    setBusy(true); setErr('')
    try {
      const data = { name: form.name, city: form.city || '', address: form.address || '', phone: form.phone || '', email: form.email || '', currency: form.currency || 'EUR', is_active: true }
      if (modal === 'add') await adminApi.locationCreate(data)
      else await adminApi.locationUpdate(form.id, data)
      showToast(modal === 'add' ? 'Restaurant added' : 'Restaurant updated')
      setModal(null); load()
    } catch (e: any) { setErr(e.message || 'Error') }
    setBusy(false)
  }

  async function del(loc: any) {
    if (!confirm(`Delete restaurant "${loc.name}"?`)) return
    try { await adminApi.locationDelete(loc.id); showToast('Deleted'); load() } catch {}
  }

  return (
    <div>
      <PanelHeader title="Restaurants / Branches" sub={`${list.length} location(s)`} action={<AddBtn onClick={() => { setForm({ currency: 'EUR' }); setModal('add'); setErr('') }} label="Add Restaurant" />} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {list.map((loc) => (
          <div key={loc.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{loc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>{loc.city}{loc.city && loc.address ? ' · ' : ''}{loc.address}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {loc.is_main && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'var(--blue-bg)', color: 'var(--blue)' }}>MAIN</span>}
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: loc.is_active ? 'var(--green-bg)' : 'var(--s3)', color: loc.is_active ? 'var(--green)' : 'var(--t3)' }}>
                  {loc.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {loc.phone && <div style={{ fontSize: 12, color: 'var(--t2)' }}>📞 {loc.phone}</div>}
              {loc.email && <div style={{ fontSize: 12, color: 'var(--t2)' }}>✉ {loc.email}</div>}
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Currency: {loc.currency}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <EditBtn onClick={() => { setForm({ ...loc }); setModal('edit'); setErr('') }} />
              <DelBtn onClick={() => del(loc)} />
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 13, gridColumn: '1/-1' }}>No restaurants yet.</div>}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Restaurant' : `Edit ${form.name}`} onClose={() => setModal(null)} onSave={save} busy={busy}>
          <Field label="Restaurant Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Leitex Main Branch" />
          <Field label="City" value={form.city || ''} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Berlin" />
          <Field label="Address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Musterstraße 1" />
          <Field label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+49 30 123456" />
          <Field label="Email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="info@restaurant.com" />
          <Sel label="Currency" value={form.currency || 'EUR'} onChange={(e) => set('currency', e.target.value)}>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EGP">EGP (E£)</option>
            <option value="SAR">SAR (﷼)</option>
            <option value="AED">AED (د.إ)</option>
          </Sel>
          {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>{err}</div>}
        </Modal>
      )}
    </div>
  )
}

// ── Orders Panel ──────────────────────────────────────────────────────────────

function OrdersPanel({ orders }: { orders: any[] }) {
  return (
    <div>
      <PanelHeader title="All Orders" sub={`${orders.length} orders`} />
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--s2)' }}>
              {['#','Type','Table','Staff','Items','Total','Status','Time'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => {
              const total  = order.total ?? (order.lines?.reduce((s: number, l: any) => s + (l.unit_price || l.unitPrice) * l.quantity, 0) || 0) - (order.discount || 0)
              const status = order.status
              const sColor = status === 'PAID' ? 'var(--green)' : status === 'VOIDED' ? 'var(--red)' : status === 'READY' ? 'var(--teal)' : 'var(--amber)'
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--b1)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--t3)' }}>#{order.id}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{order.type || 'DINE_IN'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t2)' }}>{order.table_label || order.tableLabel || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t2)' }}>{order.staff_name || order.staffName || '—'}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{order.lines?.length || 0}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>{formatCents(total || 0)}</td>
                  <td style={{ padding: '8px 12px' }}><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${sColor}18`, color: sColor }}>{status}</span></td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--t3)' }}>{new Date(order.created_at || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
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
