import { useState, useEffect } from 'react'
import { formatCents } from '../../store'

const API = 'http://localhost:8000/api'
const token = () => localStorage.getItem('access_token') || ''
const get = (path: string) => fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json())

const TIER_COLOR: Record<string, string> = {
  BRONZE:   '#b96a18',
  SILVER:   '#5c6370',
  GOLD:     '#b45309',
  PLATINUM: '#7c3aed',
}

const TABS = ['Customers', 'Reservations', 'Loyalty', 'Gift Cards']

export default function CRMView() {
  const [tab, setTab]               = useState('Customers')
  const [customers, setCustomers]   = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [giftCards, setGiftCards]   = useState<any[]>([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState<any>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [c, r, g] = await Promise.all([
        get('/customers/profiles/'),
        get('/customers/reservations/'),
        get('/customers/gift-cards/'),
      ])
      setCustomers(Array.isArray(c) ? c : c.results || [])
      setReservations(Array.isArray(r) ? r : r.results || [])
      setGiftCards(Array.isArray(g) ? g : g.results || [])
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((c) =>
    !search || `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>CRM & Customers</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{customers.length} profiles · {reservations.length} reservations</div>
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {tab === 'Customers' && (
            <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ height: 32, padding: '0 12px', background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 7, color: 'var(--t1)', fontSize: 12, outline: 'none', width: 200 }}
            />
          )}
          <button onClick={loadAll} style={{ padding: '0 12px', height: 32, borderRadius: 7, border: '1px solid var(--b2)', background: 'var(--s2)', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>Loading...</div>}

          {tab === 'Customers' && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredCustomers.map((c) => (
                <div key={c.id}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  style={{
                    background: selected?.id === c.id ? 'var(--s2)' : 'var(--s1)',
                    border: `1px solid ${selected?.id === c.id ? 'var(--accent)' : 'var(--b1)'}`,
                    borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14, transition: 'all .12s',
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${TIER_COLOR[c.loyalty_tier]}22`, border: `1.5px solid ${TIER_COLOR[c.loyalty_tier]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: TIER_COLOR[c.loyalty_tier], flexShrink: 0 }}>
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.email} {c.phone ? `· ${c.phone}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{formatCents(c.total_spent || 0)}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>total spent</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--t1)' }}>{c.loyalty_points}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>points</div>
                    </div>
                    <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: TIER_COLOR[c.loyalty_tier], background: `${TIER_COLOR[c.loyalty_tier]}18`, border: `1px solid ${TIER_COLOR[c.loyalty_tier]}30` }}>
                      {c.loyalty_tier}
                    </span>
                  </div>
                </div>
              ))}
              {filteredCustomers.length === 0 && !loading && (
                <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>
                  {customers.length === 0 ? 'No customers yet. Run seed to add demo data.' : 'No results match your search.'}
                </div>
              )}
            </div>
          )}

          {tab === 'Reservations' && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reservations.map((r) => {
                const sColor: Record<string, string> = {
                  CONFIRMED: 'var(--green)', PENDING: 'var(--amber)',
                  SEATED: 'var(--blue)', CANCELLED: 'var(--red)', NO_SHOW: 'var(--red)', COMPLETED: 'var(--t3)'
                }
                return (
                  <div key={r.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--s2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700 }}>{r.time?.slice(0,5)}</div>
                      <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>{new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.guest_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                        {r.party_size} guests {r.guest_phone ? `· ${r.guest_phone}` : ''}
                        {r.special_requests ? ` · "${r.special_requests}"` : ''}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${sColor[r.status] || 'var(--t3)'}18`, color: sColor[r.status] || 'var(--t3)' }}>
                      {r.status}
                    </span>
                  </div>
                )
              })}
              {reservations.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>No reservations. Seed data to add demos.</div>}
            </div>
          )}

          {tab === 'Loyalty' && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {Object.entries(TIER_COLOR).map(([tier, color]) => {
                  const count = customers.filter((c) => c.loyalty_tier === tier).length
                  return (
                    <div key={tier} style={{ background: 'var(--s1)', border: `1px solid ${color}30`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tier}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700, marginTop: 8, color }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>members</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Loyalty Program Rules</div>
                {[
                  { tier: 'Bronze',   threshold: '€0+',    earn: '1 pt / €1',   perks: 'Birthday bonus, member pricing' },
                  { tier: 'Silver',   threshold: '€500+',  earn: '1.5 pt / €1', perks: '+ Priority seating, monthly gift' },
                  { tier: 'Gold',     threshold: '€2,000+',earn: '2 pt / €1',   perks: '+ Complimentary dessert, free delivery' },
                  { tier: 'Platinum', threshold: '€5,000+',earn: '3 pt / €1',   perks: '+ Chef table, exclusive events, concierge' },
                ].map((r) => (
                  <div key={r.tier} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--b1)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLOR[r.tier.toUpperCase()], flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, minWidth: 70, color: TIER_COLOR[r.tier.toUpperCase()] }}>{r.tier}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--t3)', minWidth: 60 }}>{r.threshold}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--t2)', minWidth: 80 }}>{r.earn}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{r.perks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Gift Cards' && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {giftCards.map((card) => (
                <div key={card.id} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'var(--s2)', borderRadius: 6, padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--accent)' }}>
                    {card.code}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--t2)' }}>
                      {card.issued_to ? `Issued to Customer #${card.issued_to}` : 'Unissued'}
                      {card.expires_at ? ` · Expires ${card.expires_at}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: card.balance > 0 ? 'var(--green)' : 'var(--t3)' }}>
                      {formatCents(card.balance)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>of {formatCents(card.initial_amount)}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: card.is_active ? 'var(--green-bg)' : 'var(--red-bg)', color: card.is_active ? 'var(--green)' : 'var(--red)' }}>
                    {card.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {giftCards.length === 0 && <div style={{ textAlign: 'center', color: 'var(--t3)', paddingTop: 40 }}>No gift cards yet.</div>}
            </div>
          )}
        </div>

        {/* Customer detail sidebar */}
        {selected && tab === 'Customers' && (
          <div style={{ width: 260, background: 'var(--s1)', borderLeft: '1px solid var(--b1)', overflow: 'auto', padding: 16, flexShrink: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${TIER_COLOR[selected.loyalty_tier]}22`, border: `2px solid ${TIER_COLOR[selected.loyalty_tier]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: TIER_COLOR[selected.loyalty_tier], margin: '0 auto 10px' }}>
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.first_name} {selected.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{selected.email}</div>
              <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: TIER_COLOR[selected.loyalty_tier], background: `${TIER_COLOR[selected.loyalty_tier]}18` }}>
                {selected.loyalty_tier}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: 'Total Spent', v: formatCents(selected.total_spent || 0) },
                { l: 'Loyalty Points', v: String(selected.loyalty_points) },
                { l: 'Orders', v: String(selected.order_count || 0) },
                { l: 'Phone', v: selected.phone || '—' },
              ].map((s) => (
                <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--s2)', borderRadius: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{s.l}</span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
