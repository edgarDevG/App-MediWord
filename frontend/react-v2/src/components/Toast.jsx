import { useState, useEffect, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════
   useToast.js + ToastContainer.jsx
   Archivo: src/components/Toast.jsx
   Uso:
     const { showToast, ToastContainer } = useToast();
     <ToastContainer />
     showToast('Guardado', 'success')  // success | error | warning | info
   ══════════════════════════════════════════════════════════════ */

const ICONS = { success:'check_circle', error:'cancel', warning:'warning', info:'info' };
const COLORS = {
  success: { bg:'rgba(5,150,105,0.95)',  border:'rgba(5,150,105,0.3)' },
  error:   { bg:'rgba(186,26,26,0.95)',  border:'rgba(186,26,26,0.3)' },
  warning: { bg:'rgba(180,83,9,0.95)',   border:'rgba(245,158,11,0.4)' },
  info:    { bg:'rgba(26,78,215,0.95)',  border:'rgba(26,78,215,0.3)' },
};

function ToastItem({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(() => onRemove(id), 300); }, 3800);
    return () => clearTimeout(t);
  }, []);

  const c = COLORS[type] ?? COLORS.info;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'12px 16px', borderRadius:'var(--radius-xl)',
      background: c.bg, border:`1px solid ${c.border}`,
      boxShadow:'0 8px 24px rgba(0,0,0,0.18)',
      color:'white', maxWidth:360, minWidth:260,
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition:'transform 280ms cubic-bezier(0.34,1.2,0.64,1), opacity 280ms ease',
    }}>
      <span className="material-symbols-outlined filled sm" style={{ flexShrink:0 }}>{ICONS[type] ?? 'info'}</span>
      <span style={{ fontSize:'0.875rem', fontWeight:500, flex:1 }}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:2, flexShrink:0 }}>
        <span className="material-symbols-outlined sm">close</span>
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = useCallback(() => (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      display:'flex', flexDirection:'column', gap:10,
      pointerEvents:'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents:'all' }}>
          <ToastItem {...t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  ), [toasts, removeToast]);

  return { showToast, ToastContainer };
}

