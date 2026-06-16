import { useStore } from '../store'
import type { View } from '../types'

const icons: Record<string, JSX.Element> = {
  pos:           (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>),
  tables:        (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M7 12v5M17 12v5M5 17h14"/></svg>),
  kds:           (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 3 1.5 5.5 4 7v2h8v-2c2.5-1.5 4-4 4-7 0-4-4-7-8-7z"/><path d="M9 17v3M15 17v3M9 20h6"/></svg>),
  inventory:     (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-8-5-8 5v10l8 5 8-5V7z"/><path d="M12 2v20M2 7l10 6 10-6"/></svg>),
  analytics:     (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-4 4"/></svg>),
  backoffice:    (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  crm:           (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>),
  delivery:      (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><circle cx="9" cy="21" r="2"/><circle cx="19" cy="21" r="2"/><path d="M13 8h5l3 5v4h-5M13 8v9"/></svg>),
  subscriptions: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>),
  settings:      (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>),
}

const GROUPS = [
  { label: 'Front of House', items: ['pos','tables','kds','delivery'] as View[] },
  { label: 'Operations',     items: ['inventory','crm'] as View[] },
  { label: 'Management',     items: ['analytics','backoffice','subscriptions'] as View[] },
]

const LABELS: Record<View, string> = {
  pos:'POS', tables:'Tables', kds:'Kitchen', inventory:'Stock',
  analytics:'Reports', backoffice:'Back Office', crm:'CRM',
  delivery:'Orders', subscriptions:'Plans',
}

export default function Sidebar() {
  const view       = useStore((s) => s.view)
  const setView    = useStore((s) => s.setView)
  const staff      = useStore((s) => s.currentStaff)
  const setShowPin = useStore((s) => s.setShowPinModal)
  const orders     = useStore((s) => s.orders)

  const kdsCount = orders
    .filter((o) => o.status === 'SENT')
    .reduce((n, o) => n + o.lines.filter((l) => l.kdsStatus === 'PENDING' || l.kdsStatus === 'COOKING').length, 0)

  const initials = staff ? staff.name.split(' ').map((n: string) => n[0]).join('').slice(0,2) : 'NA'

  return (
    <aside style={{ width:64, background:'var(--s1)', borderRight:'1px solid var(--b1)', display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 12px', flexShrink:0, overflowY:'auto' }}>
      {/* Logo */}
      <div style={{ marginBottom:14 }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect x="1" y="1" width="14" height="14" rx="2.5" fill="#1a1a1a"/>
          <rect x="17" y="1" width="14" height="14" rx="2.5" fill="#FFCE00"/>
          <rect x="1" y="17" width="14" height="14" rx="2.5" fill="#FFCE00"/>
          <rect x="17" y="17" width="14" height="14" rx="2.5" fill="#1a1a1a"/>
          <circle cx="8" cy="8" r="2.5" fill="#FFCE00"/>
          <circle cx="24" cy="24" r="2.5" fill="#FFCE00"/>
        </svg>
      </div>

      {GROUPS.map((g, gi) => (
        <div key={g.label} style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:2, marginBottom: gi < GROUPS.length-1 ? 4 : 0 }}>
          {gi > 0 && <div style={{ width:32, height:1, background:'var(--b1)', margin:'4px 0' }} />}
          {g.items.map((id) => {
            const active = view === id
            const badge  = id === 'kds' && kdsCount > 0 ? kdsCount : null
            return (
              <button key={id} onClick={() => setView(id)} title={LABELS[id]}
                style={{ width:44, height:44, borderRadius:10, border:'none', background: active ? 'var(--accent)' : 'transparent', color: active ? 'white' : 'var(--t3)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', position:'relative', cursor:'pointer' }}
                onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background='var(--s3)'; (e.currentTarget as HTMLButtonElement).style.color='var(--t1)' } }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color='var(--t3)' } }}
              >
                {icons[id]}
                {badge && (
                  <span style={{ position:'absolute', top:5, right:5, background:'var(--red)', color:'white', borderRadius:'50%', width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      <div style={{ flex:1 }} />

      <button title="Settings" style={{ width:44, height:44, borderRadius:10, border:'none', background:'transparent', color:'var(--t3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background='var(--s3)'; (e.currentTarget as HTMLButtonElement).style.color='var(--t1)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color='var(--t3)' }}
      >
        {icons.settings}
      </button>

      <button onClick={() => setShowPin(true)} title={staff?.name}
        style={{ width:34, height:34, borderRadius:'50%', marginTop:6, background:'var(--purple-bg)', border:'1.5px solid var(--purple)', color:'var(--purple)', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
      >
        {initials}
      </button>
    </aside>
  )
}
