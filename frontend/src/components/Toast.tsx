import { useStore } from '../store'

export function Toast() {
  const toast = useStore((s) => s.toast)
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--s3)', border: '1px solid var(--b3)', borderRadius: 20,
      padding: '8px 18px', fontSize: 12, color: 'var(--t1)',
      pointerEvents: 'none', zIndex: 1000,
      opacity: toast ? 1 : 0, transition: 'opacity .2s',
      whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {toast}
    </div>
  )
}

export default Toast
