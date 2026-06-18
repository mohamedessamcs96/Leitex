import { useState, useEffect } from 'react'
import { useStore } from '../store'

const STAFF_HINTS = [
  { name: 'James',  role: 'Manager',  pin: '1234', color: '#a855f7' },
  { name: 'Sofia',  role: 'Cashier',  pin: '2222', color: '#3b82f6' },
  { name: 'Marco',  role: 'Waiter',   pin: '3333', color: '#22c55e' },
  { name: 'Anna',   role: 'Waiter',   pin: '4444', color: '#22c55e' },
  { name: 'Chen',   role: 'Kitchen',  pin: '5555', color: '#f59e0b' },
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 760)
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 760) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

export default function LoginScreen() {
  const pinLogin = useStore((s) => s.pinLogin)
  const authLoading = useStore((s) => s.authLoading)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<typeof STAFF_HINTS[number] | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const now = useClock()
  const isMobile = useIsMobile()

  function handleKey(k: string) {
    if (authLoading || pin.length >= 4) return
    const next = pin + k
    setPin(next)
    setError(false)
    if (next.length === 4) {
      pinLogin(next).then((ok) => {
        if (!ok) {
          setError(true)
          setTimeout(() => { setPin(''); setError(false) }, 800)
        }
      })
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      background: 'var(--bg)', overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Left branding panel */}
      <div style={{
        flex: isMobile ? '0 0 auto' : '0 0 42%', minWidth: isMobile ? 0 : 380, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: isMobile ? '28px 24px' : '48px 56px',
        background: 'radial-gradient(circle at 25% 20%, rgba(232,97,44,0.25), transparent 55%), linear-gradient(160deg, #1a1410 0%, #0c0c0e 70%)',
        borderRight: isMobile ? 'none' : '1px solid var(--b1)',
        borderBottom: isMobile ? '1px solid var(--b1)' : 'none',
      }}>
        {/* Decorative grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--b1) 1px, transparent 1px), linear-gradient(90deg, var(--b1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 70%)',
        }} />

        {/* Logo + brand */}
        <div className="fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width={isMobile ? 36 : 46} height={isMobile ? 36 : 46} viewBox="0 0 32 32" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2.5" fill="#f0f0f0"/>
              <rect x="17" y="1" width="14" height="14" rx="2.5" fill="#FFCE00"/>
              <rect x="1" y="17" width="14" height="14" rx="2.5" fill="#FFCE00"/>
              <rect x="17" y="17" width="14" height="14" rx="2.5" fill="#f0f0f0"/>
              <circle cx="8" cy="8" r="2.5" fill="#FFCE00"/>
              <circle cx="24" cy="24" r="2.5" fill="#FFCE00"/>
            </svg>
            <div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1 }}>
                <span>LEIT</span><span style={{ color: '#CC0000' }}>E</span><span>X</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.18em', marginTop: 4, textTransform: 'uppercase' }}>Restaurant Management</div>
            </div>
          </div>
        </div>

        {/* Center hero copy */}
        {!isMobile && (
          <div className="slide-up" style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 20, background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.25)',
              fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 18,
            }}>
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              System Online
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Welcome back to your floor.
            </div>
            <div style={{ fontSize: 14, color: 'var(--t2)', marginTop: 12, lineHeight: 1.6 }}>
              Sign in with your staff PIN to manage orders, tables and the kitchen in real time.
            </div>
          </div>
        )}

        {/* Clock + footer */}
        <div className="fade-in" style={{ position: 'relative', zIndex: 1, marginTop: isMobile ? 16 : 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isMobile ? 24 : 42, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {timeStr}
          </div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>{dateStr}</div>
        </div>
      </div>

      {/* Right login panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : 32 }}>
        <div className="slide-up" style={{ width: isMobile ? '100%' : 380, maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>Staff Sign In</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Select your name, then enter your PIN</div>
          </div>

          {/* Staff selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STAFF_HINTS.map((s) => {
              const active = selectedStaff?.name === s.name
              return (
                <button
                  key={s.name}
                  onClick={() => { setSelectedStaff(s); setPin(''); setError(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px 6px 6px', borderRadius: 24,
                    background: active ? 'rgba(232,97,44,0.12)' : 'var(--s2)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--b2)'}`,
                    color: active ? 'var(--t1)' : 'var(--t2)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .12s',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: s.color, color: '#0c0c0e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {s.name[0]}
                  </span>
                  {s.name}
                  <span style={{ fontSize: 10, opacity: 0.6 }}>· {s.role}</span>
                </button>
              )
            })}
          </div>

          {/* PIN card */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 16, padding: '26px 28px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: 22, fontSize: 13, color: error ? 'var(--red)' : 'var(--t3)', transition: 'color .12s' }}>
              {error ? 'Incorrect PIN — try again' : selectedStaff ? `Enter PIN for ${selectedStaff.name}` : 'Enter your 4-digit PIN'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: i < pin.length ? (error ? 'var(--red)' : 'var(--accent)') : 'transparent',
                  border: `2px solid ${i < pin.length ? (error ? 'var(--red)' : 'var(--accent)') : 'var(--b3)'}`,
                  transition: 'all .12s',
                  transform: error ? 'scale(1.15)' : 'scale(1)',
                }} />
              ))}
            </div>

            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                k === '' ? <div key={i} /> :
                <button
                  key={k}
                  onClick={() => k === '⌫' ? handleBackspace() : handleKey(k)}
                  disabled={authLoading}
                  style={{
                    height: 56, borderRadius: 12, border: '1px solid var(--b2)',
                    background: 'var(--s2)',
                    color: k === '⌫' ? 'var(--t3)' : 'var(--t1)',
                    fontSize: k === '⌫' ? 20 : 22, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all .1s', opacity: authLoading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--s3)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--s2)'}
                >
                  {authLoading && k === '0' ? '···' : k}
                </button>
              ))}
            </div>
          </div>

          {/* Demo credentials disclosure */}
          <div>
            <button
              onClick={() => setShowDemo((v) => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, border: '1px solid var(--b1)',
                background: 'transparent', color: 'var(--t3)', fontSize: 12, cursor: 'pointer',
              }}
            >
              <span>Demo credentials</span>
              <span style={{ transition: 'transform .15s', transform: showDemo ? 'rotate(180deg)' : 'none' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </button>
            {showDemo && (
              <div className="fade-in" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ marginBottom: 6, fontWeight: 600, color: 'var(--t2)' }}>Admin Panel</div>
                  <div>Username: <code style={{ color: 'var(--accent)', fontWeight: 600 }}>admin</code> · Password: <code style={{ color: 'var(--accent)', fontWeight: 600 }}>admin123</code></div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ marginBottom: 6, fontWeight: 600, color: 'var(--t2)' }}>Staff PINs</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {STAFF_HINTS.map((s) => (
                      <span key={s.pin}>{s.name}: <code style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.pin}</code></span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
