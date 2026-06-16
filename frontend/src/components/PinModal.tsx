import { useState } from 'react'
import { useStore } from '../store'

export default function PinModal() {
  const setShowPinModal = useStore((s) => s.setShowPinModal)
  const pinLogin        = useStore((s) => s.pinLogin)
  const logout          = useStore((s) => s.logout)
  const currentStaff    = useStore((s) => s.currentStaff)
  const authLoading     = useStore((s) => s.authLoading)

  const [pin, setPin]     = useState('')
  const [error, setError] = useState(false)

  function handleKey(k: string) {
    if (authLoading || pin.length >= 4) return
    const next = pin + k
    setPin(next)
    setError(false)
    if (next.length === 4) {
      pinLogin(next).then((ok) => {
        if (!ok) {
          setError(true)
          setTimeout(() => { setPin(''); setError(false) }, 700)
        } else {
          setShowPinModal(false)
        }
      })
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}>
      <div style={{ background: 'var(--s1)', borderRadius: 14, width: 320, border: '1px solid var(--b2)', overflow: 'hidden', padding: '28px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Switch Staff</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            Currently: <span style={{ color: 'var(--t1)' }}>{currentStaff?.name}</span>
          </div>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: i < pin.length ? (error ? 'var(--red)' : 'var(--accent)') : 'var(--s3)',
              border: `1.5px solid ${i < pin.length ? (error ? 'var(--red)' : 'var(--accent)') : 'var(--b2)'}`,
              transition: 'all .1s',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            k === '' ? <div key={i} /> :
            <button
              key={k}
              onClick={() => k === '⌫' ? handleBackspace() : handleKey(k)}
              disabled={authLoading}
              style={{
                height: 52, borderRadius: 10, border: '1px solid var(--b2)',
                background: 'var(--s2)', color: k === '⌫' ? 'var(--t3)' : 'var(--t1)',
                fontSize: k === '⌫' ? 18 : 20, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', transition: 'all .1s',
                opacity: authLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--s3)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--s2)'}
            >
              {k}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={() => { logout(); setShowPinModal(false) }}
            style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 12, cursor: 'pointer' }}
          >
            Sign Out
          </button>
          <button
            onClick={() => setShowPinModal(false)}
            style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t3)', fontSize: 12, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
