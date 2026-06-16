import { useState, useEffect } from 'react'
import { formatCents } from '../../store'

const API = 'http://localhost:8000/api'
const tok = () => localStorage.getItem('access_token') || ''
const apiFetch = (path: string) =>
  fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${tok()}` } }).then((r) => r.json())

const TIER_COLOR: Record<string, string> = {
  STARTER:    '#6b7280',
  ESSENTIAL:  '#3b82f6',
  PREMIUM:    '#a855f7',
  ENTERPRISE: '#f59e0b',
}

const ADDON_ICONS: Record<string, JSX.Element> = {
  KDS:            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8 2 4 5 4 9c0 3 1.5 5.5 4 7v2h8v-2c2.5-1.5 4-4 4-7 0-4-4-7-8-7z"/><path d="M9 17v3M15 17v3M9 20h6"/></svg>,
  RESERVATIONS:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  DELIVERY:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M9 17H7m12 0h-2m-5 0a2 2 0 104 0 2 2 0 00-4 0M13 6h5l3 5v4h-2"/></svg>,
  LOYALTY:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  EXTRA_REGISTER: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  EXTRA_LOCATION: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
}

const PLANS_DEMO = [
  {
    tier: 'STARTER', name: 'Starter', price_monthly: 49, price_yearly: 490,
    max_registers: 1, max_locations: 1, max_staff: 3,
    has_kds: false, has_analytics: false, has_loyalty: false, has_delivery: false, has_api: false, has_ai: false,
    features: ['POS ordering','Cash & card payments','Basic reports','1 register','3 staff accounts','Email support'],
  },
  {
    tier: 'ESSENTIAL', name: 'Essential', price_monthly: 99, price_yearly: 990,
    max_registers: 3, max_locations: 2, max_staff: 10,
    has_kds: true, has_analytics: true, has_loyalty: false, has_delivery: false, has_api: false, has_ai: false,
    features: ['All Starter features','Kitchen Display System','Inventory tracking','Customer profiles','Advanced reports','2 locations','10 staff accounts','Priority support'],
  },
  {
    tier: 'PREMIUM', name: 'Premium', price_monthly: 199, price_yearly: 1990,
    max_registers: 10, max_locations: 5, max_staff: 25,
    has_kds: true, has_analytics: true, has_loyalty: true, has_delivery: true, has_api: false, has_ai: false,
    features: ['All Essential features','Loyalty & CRM','Delivery integrations','Online ordering','QR self-ordering','5 locations','25 staff accounts','Reservation system','Dedicated support'],
  },
  {
    tier: 'ENTERPRISE', name: 'Enterprise', price_monthly: 399, price_yearly: 3990,
    max_registers: 999, max_locations: 999, max_staff: 999,
    has_kds: true, has_analytics: true, has_loyalty: true, has_delivery: true, has_api: true, has_ai: true,
    features: ['All Premium features','AI-powered insights','Open API access','Custom integrations','Unlimited locations','Unlimited staff','White-label option','SLA guarantee','Custom onboarding'],
  },
]

const ADDONS_DEMO = [
  { type: 'KDS',           label: 'Kitchen Display',    price: 29,  desc: 'Additional KDS screen per station' },
  { type: 'RESERVATIONS',  label: 'Reservations',       price: 19,  desc: 'Online bookings & waitlist' },
  { type: 'DELIVERY',      label: 'Delivery Platform',  price: 39,  desc: 'Uber Eats, Deliveroo, Just Eat' },
  { type: 'LOYALTY',       label: 'Loyalty & CRM',      price: 29,  desc: 'Points, tiers, gift cards' },
  { type: 'EXTRA_REGISTER',label: 'Extra Register',     price: 19,  desc: 'Additional POS terminal' },
  { type: 'EXTRA_LOCATION',label: 'Extra Location',     price: 49,  desc: 'Additional branch' },
]

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

export default function SubscriptionsView() {
  const [plans, setPlans]       = useState<any[]>([])
  const [billing, setBilling]   = useState<'monthly' | 'yearly'>('monthly')
  const [activePlan, setActive] = useState('PREMIUM')
  const [tab, setTab]           = useState<'plans' | 'addons' | 'billing'>('plans')

  useEffect(() => {
    apiFetch('/subscriptions/plans/').then((d: any) => {
      const list = Array.isArray(d) ? d : d.results || []
      if (list.length > 0) setPlans(list)
      else setPlans(PLANS_DEMO)
    }).catch(() => setPlans(PLANS_DEMO))
  }, [])

  const displayPlans = plans.length > 0 ? plans : PLANS_DEMO

  const savings = (p: any) => {
    const monthly = p.price_monthly * 12
    const yearly  = p.price_yearly
    return monthly > 0 ? Math.round(((monthly - yearly) / monthly) * 100) : 0
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--b1)', background: 'var(--s1)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Subscriptions & Pricing</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Plans, add-ons, and billing management</div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
          {(['plans','addons','billing'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 14px', borderRadius: 7, border: 'none',
              background: tab === t ? 'var(--s3)' : 'transparent',
              color: tab === t ? 'var(--t1)' : 'var(--t3)',
              fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>
        {tab === 'plans' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'var(--s2)', borderRadius: 8, padding: 2 }}>
            {(['monthly','yearly'] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: billing === b ? 'var(--s4)' : 'transparent',
                color: billing === b ? 'var(--t1)' : 'var(--t3)',
                fontSize: 12, fontWeight: billing === b ? 600 : 400, textTransform: 'capitalize',
              }}>
                {b}
                {b === 'yearly' && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--green)', fontWeight: 700 }}>SAVE 17%</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Plans tab */}
        {tab === 'plans' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {displayPlans.map((plan: any) => {
              const isActive = plan.tier === activePlan
              const color    = TIER_COLOR[plan.tier] || 'var(--accent)'
              const price    = billing === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly
              const save     = savings(plan)
              return (
                <div key={plan.tier} style={{
                  background: 'var(--s1)',
                  border: `1.5px solid ${isActive ? color : 'var(--b1)'}`,
                  borderRadius: 12, overflow: 'hidden',
                  position: 'relative',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all .2s',
                  boxShadow: isActive ? `0 0 24px ${color}22` : 'none',
                }}>
                  {/* Top accent bar */}
                  <div style={{ height: 3, background: color }} />

                  {isActive && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: color, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '0.05em' }}>
                      CURRENT
                    </div>
                  )}

                  {plan.tier === 'PREMIUM' && !isActive && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--accent)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                      POPULAR
                    </div>
                  )}

                  <div style={{ padding: '20px 18px 0' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
                        €{typeof price === 'number' ? price.toFixed(0) : parseFloat(price).toFixed(0)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', paddingBottom: 6 }}>/mo</span>
                    </div>
                    {billing === 'yearly' && save > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 6 }}>Save {save}% billed annually</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14 }}>
                      {plan.max_registers === 999 ? 'Unlimited' : plan.max_registers} register{plan.max_registers !== 1 ? 's' : ''} ·{' '}
                      {plan.max_locations === 999 ? 'Unlimited' : plan.max_locations} location{plan.max_locations !== 1 ? 's' : ''}
                    </div>

                    <button
                      onClick={() => setActive(plan.tier)}
                      style={{
                        width: '100%', height: 36, borderRadius: 8, border: 'none',
                        background: isActive ? color : 'var(--s3)',
                        color: isActive ? 'white' : 'var(--t2)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
                        transition: 'all .15s',
                      }}
                    >
                      {isActive ? 'Current Plan' : 'Switch Plan'}
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--b1)', margin: '0 18px 14px' }} />

                  {/* Features */}
                  <div style={{ padding: '0 18px 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {(plan.features || []).map((f: string) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                        <span style={{ color: color, flexShrink: 0, marginTop: 1 }}><CheckIcon /></span>
                        <span style={{ color: 'var(--t2)', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                    {/* Feature toggles */}
                    {[
                      { label: 'KDS',           val: plan.has_kds },
                      { label: 'AI Insights',    val: plan.has_ai },
                      { label: 'Open API',       val: plan.has_api },
                    ].filter((f) => f.val !== undefined).map((f) => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: f.val ? 1 : 0.4 }}>
                        <span style={{ color: f.val ? color : 'var(--t3)', flexShrink: 0 }}>
                          {f.val ? <CheckIcon /> : <XIcon />}
                        </span>
                        <span style={{ color: f.val ? 'var(--t2)' : 'var(--t3)' }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add-ons tab */}
        {tab === 'addons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Available Add-ons</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Enhance your plan with additional features</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {ADDONS_DEMO.map((addon) => (
                <div key={addon.type} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        {ADDON_ICONS[addon.type]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{addon.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{addon.desc}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700 }}>€{addon.price}</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>/mo</span>
                    </div>
                    <button style={{
                      padding: '6px 14px', borderRadius: 7, border: 'none',
                      background: 'var(--accent)', color: 'white',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing tab */}
        {tab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
            {/* Current plan summary */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Current Subscription</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { l: 'Plan',      v: 'Premium' },
                  { l: 'Billing',   v: 'Monthly' },
                  { l: 'Locations', v: '1 of 5' },
                  { l: 'Status',    v: 'Active' },
                  { l: 'Renews',    v: '1 Jun 2026' },
                  { l: 'Amount',    v: '€199.00/mo' },
                ].map((s) => (
                  <div key={s.l} style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>{s.l}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Payment Method</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--s2)', borderRadius: 8 }}>
                <svg width="32" height="22" viewBox="0 0 32 22" fill="none">
                  <rect width="32" height="22" rx="3" fill="#1a1f71"/>
                  <circle cx="12" cy="11" r="6" fill="#eb001b" opacity="0.9"/>
                  <circle cx="20" cy="11" r="6" fill="#f79e1b" opacity="0.9"/>
                  <path d="M16 6.5a6 6 0 010 9A6 6 0 0116 6.5z" fill="#ff5f00"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>Mastercard ending in 4242</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Expires 09/28</div>
                </div>
                <button style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>
                  Update
                </button>
              </div>
            </div>

            {/* Invoice history */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--b1)', fontWeight: 600, fontSize: 13 }}>Invoice History</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--s2)' }}>
                    {['Invoice','Date','Plan','Amount','Status'].map((h) => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { num: 'INV-2026-005', date: '1 May 2026',  plan: 'Premium', amount: 19900, status: 'Paid' },
                    { num: 'INV-2026-004', date: '1 Apr 2026',  plan: 'Premium', amount: 19900, status: 'Paid' },
                    { num: 'INV-2026-003', date: '1 Mar 2026',  plan: 'Premium', amount: 19900, status: 'Paid' },
                    { num: 'INV-2026-002', date: '1 Feb 2026',  plan: 'Essential', amount: 9900, status: 'Paid' },
                    { num: 'INV-2026-001', date: '1 Jan 2026',  plan: 'Essential', amount: 9900, status: 'Paid' },
                  ].map((inv) => (
                    <tr key={inv.num} style={{ borderBottom: '1px solid var(--b1)' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--s2)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{inv.num}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--t2)' }}>{inv.date}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12 }}>{inv.plan}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{formatCents(inv.amount)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
