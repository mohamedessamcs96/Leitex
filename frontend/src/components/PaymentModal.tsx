import { useState } from 'react'
import { useStore, formatCents } from '../store'
import type { PayMethod } from '../types'

export default function PaymentModal({ total }: { total: number }) {
  const setPayModal    = useStore((s) => s.setPayModal)
  const submitOrder    = useStore((s) => s.submitOrder)
  const payOrderStore  = useStore((s) => s.payOrder)
  const orders         = useStore((s) => s.orders)
  const draftLines     = useStore((s) => s.draftOrder.lines)
  const showToast      = useStore((s) => s.showToast)

  const [method, setMethod]       = useState<PayMethod>('CARD')
  const [cashInput, setCashInput] = useState('')
  const [processing, setProcessing] = useState(false)

  const cashAmount = parseFloat(cashInput || '0') * 100
  const change     = method === 'CASH' ? Math.max(0, cashAmount - total) : 0

  async function handlePay() {
    if (processing) return
    setProcessing(true)
    try {
      let orderId: number | null = null

      if (draftLines.length > 0) {
        const order = await submitOrder()
        orderId = order ? parseInt(order.id) : null
      } else {
        const active = orders.find((o) => o.status === 'SENT' || o.status === 'OPEN' || o.status === 'READY')
        orderId = active ? parseInt(active.id) : null
      }

      if (!orderId) {
        showToast('No active order to pay')
        setPayModal(false)
        return
      }

      await payOrderStore(orderId, method, total)
      setPayModal(false)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={(e) => { if (e.target === e.currentTarget) setPayModal(false) }}
    >
      <div style={{ background: 'var(--s1)', borderRadius: 12, width: 360, border: '1px solid var(--b2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Process Payment</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--green)', marginTop: 6 }}>
            {formatCents(total)}
          </div>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['CASH', 'CARD', 'SPLIT'] as PayMethod[]).map((m) => {
              const icons: Partial<Record<PayMethod, JSX.Element>> = {
                CASH: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="3"/><path d="M1 10h22M8 16h2"/></svg>,
                CARD: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/><path d="M7 15h2M11 15h4"/></svg>,
                SPLIT: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
              }
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  style={{
                    height: 52, borderRadius: 8,
                    border: `1.5px solid ${method === m ? 'var(--accent)' : 'var(--b2)'}`,
                    background: method === m ? 'rgba(232,97,44,0.1)' : 'var(--s2)',
                    color: method === m ? 'var(--accent)' : 'var(--t2)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {icons[m]}
                  {m}
                </button>
              )
            })}
          </div>

          {method === 'CASH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Amount tendered (€)</div>
              <input
                type="number"
                placeholder="0.00"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                autoFocus
                style={{
                  height: 50, borderRadius: 8, border: '1px solid var(--b2)',
                  background: 'var(--s2)', color: 'var(--t1)', fontSize: 22,
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  textAlign: 'right', paddingRight: 14, outline: 'none',
                }}
              />
              {cashAmount >= total && cashAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--green-bg)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)' }}>
                  <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Change Due</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--green)', fontWeight: 700 }}>
                    {formatCents(change)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPayModal(false)}
            style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t2)', fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={processing || (method === 'CASH' && cashInput !== '' && cashAmount < total)}
            style={{
              flex: 2, height: 42, borderRadius: 8, border: 'none',
              background: processing ? 'var(--s3)' : 'var(--green)',
              color: processing ? 'var(--t3)' : 'white',
              fontSize: 13, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all .12s',
            }}
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
