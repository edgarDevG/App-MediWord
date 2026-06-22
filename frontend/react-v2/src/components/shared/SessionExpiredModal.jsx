import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* ══════════════════════════════════════════════════════════════
   SessionExpiredModal — Modal premium de sesión expirada
   Escucha el evento custom 'session-expired' emitido por
   el interceptor de Axios.
   ══════════════════════════════════════════════════════════════ */

export default function SessionExpiredModal() {
  const [show, setShow]     = useState(false);
  const [count, setCount]   = useState(5);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  // Countdown de redirección
  useEffect(() => {
    if (!show) return;
    if (count <= 0) {
      window.location.href = '/login';
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [show, count]);

  if (!show) return null;

  const goLogin = () => { window.location.href = '/login'; };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,16,62,0.60)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      animation: 'sessFadeIn 300ms ease',
    }}>
      <div style={{
        background: 'white', borderRadius: 24,
        padding: '2.5rem 2rem', width: '100%', maxWidth: 400,
        boxShadow: '0 32px 64px rgba(0,16,62,0.28)',
        textAlign: 'center',
        animation: 'sessSlideUp 350ms cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Icono animado */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(26,78,215,0.08), rgba(26,78,215,0.16))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          animation: 'sessPulse 2s ease-in-out infinite',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 36, color: '#1a4ed7',
            fontVariationSettings: "'FILL' 1",
          }}>lock_clock</span>
        </div>

        {/* Título */}
        <h2 style={{
          fontSize: '1.25rem', fontWeight: 800, color: '#00103e',
          margin: '0 0 8px', letterSpacing: '-0.01em',
        }}>
          Tu sesión ha expirado
        </h2>

        <p style={{
          fontSize: '0.875rem', color: '#64748b',
          lineHeight: 1.6, margin: '0 0 1.5rem',
        }}>
          Por seguridad, tu sesión se ha cerrado automáticamente.
          Inicia sesión nuevamente para continuar.
        </p>

        {/* Countdown */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '10px 16px',
          background: 'rgba(26,78,215,0.04)',
          border: '1px solid rgba(26,78,215,0.10)',
          borderRadius: 12, marginBottom: '1.25rem',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 16, color: '#1a4ed7',
            animation: 'spin 1.5s linear infinite',
          }}>progress_activity</span>
          <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>
            Redirigiendo en <strong style={{ color: '#1a4ed7' }}>{count}s</strong>
          </span>
        </div>

        {/* Botón */}
        <button
          onClick={goLogin}
          style={{
            width: '100%', padding: '12px 24px',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #1a4ed7, #0A5C99)',
            color: 'white', fontWeight: 700, fontSize: '0.9375rem',
            cursor: 'pointer', letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(26,78,215,0.3)',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(26,78,215,0.4)'; }}
          onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 16px rgba(26,78,215,0.3)'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>login</span>
          Iniciar sesión
        </button>
      </div>

      <style>{`
        @keyframes sessFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes sessSlideUp{from{opacity:0;transform:translateY(24px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes sessPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>,
    document.body
  );
}
