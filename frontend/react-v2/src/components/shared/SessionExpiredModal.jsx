import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { resetSessionExpired } from '../../api/axiosInstance';

const COUNTDOWN = 30;

export default function SessionExpiredModal() {
  const [show,       setShow]       = useState(false);
  const [mode,       setMode]       = useState('notice');   // 'notice' | 'renew'
  const [count,      setCount]      = useState(COUNTDOWN);
  const [password,   setPassword]   = useState('');
  const [logging,    setLogging]    = useState(false);
  const [loginError, setLoginError] = useState('');

  /* ── Email pre-cargado del usuario actual ── */
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const userEmail  = storedUser?.email || storedUser?.correo || '';

  /* ── Escucha el evento de expiración ── */
  useEffect(() => {
    const handler = () => {
      setShow(true);
      setMode('notice');
      setCount(COUNTDOWN);
      setPassword('');
      setLoginError('');
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  /* ── Countdown (solo en modo aviso, se pausa en modo renovar) ── */
  useEffect(() => {
    if (!show || mode !== 'notice') return;
    if (count <= 0) { window.location.href = '/login'; return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [show, count, mode]);

  const goLogin = () => { window.location.href = '/login'; };

  /* ── Renovar sesión inline ── */
  const handleRenew = useCallback(async (e) => {
    e.preventDefault();
    if (!password.trim()) { setLoginError('Ingresa tu contraseña.'); return; }
    setLogging(true);
    setLoginError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',   // recibe el nuevo refresh_token en cookie httpOnly
        body:        JSON.stringify({ email: userEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Credenciales incorrectas.');
      localStorage.setItem('token', data.access_token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      resetSessionExpired();
      window.dispatchEvent(new CustomEvent('session-renewed', { detail: data.user }));
      setShow(false);
      setPassword('');
    } catch (err) {
      setLoginError(err.message || 'Error al renovar. Intenta de nuevo.');
    } finally {
      setLogging(false);
    }
  }, [password, userEmail]);

  if (!show) return null;

  /* ── Porcentaje del countdown ── */
  const pct = Math.round((count / COUNTDOWN) * 100);
  const colorPct = count <= 10 ? '#dc2626' : count <= 20 ? '#d97706' : '#1a4ed7';

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,16,62,0.65)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      animation: 'sessFadeIn 250ms ease',
    }}>
      <div style={{
        background: 'white', borderRadius: 24,
        padding: '2.5rem 2rem', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 64px rgba(0,16,62,0.30)',
        animation: 'sessSlideUp 320ms cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* ── Icono ── */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: mode === 'renew'
            ? 'linear-gradient(135deg,rgba(14,155,138,0.10),rgba(14,155,138,0.18))'
            : 'linear-gradient(135deg,rgba(26,78,215,0.08),rgba(26,78,215,0.16))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          transition: 'background 300ms',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 36,
            color: mode === 'renew' ? '#0E9B8A' : '#1a4ed7',
            fontVariationSettings: "'FILL' 1",
            transition: 'color 300ms',
          }}>
            {mode === 'renew' ? 'key' : 'lock_clock'}
          </span>
        </div>

        {/* ── Título ── */}
        <h2 style={{
          fontSize: '1.25rem', fontWeight: 800, color: '#00103e',
          margin: '0 0 8px', letterSpacing: '-0.01em', textAlign: 'center',
        }}>
          {mode === 'renew' ? 'Renovar sesión' : 'Tu sesión ha expirado'}
        </h2>

        <p style={{
          fontSize: '0.875rem', color: '#64748b',
          lineHeight: 1.6, margin: '0 0 1.5rem', textAlign: 'center',
        }}>
          {mode === 'renew'
            ? 'Ingresa tu contraseña para continuar sin perder tu trabajo.'
            : 'Por seguridad tu sesión se cerró automáticamente. Puedes renovarla o cerrar sesión.'}
        </p>

        {/* ── MODO AVISO ── */}
        {mode === 'notice' && (
          <>
            {/* Countdown visual */}
            <div style={{
              position: 'relative', margin: '0 auto 1.5rem',
              width: 72, height: 72,
            }}>
              <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(197,198,210,0.35)" strokeWidth="5" />
                <circle cx="36" cy="36" r="30" fill="none"
                  stroke={colorPct} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 800ms linear, stroke 600ms ease' }}
                />
              </svg>
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                fontSize: '1.125rem', fontWeight: 800, color: colorPct,
                transition: 'color 600ms',
              }}>{count}s</span>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1.5rem' }}>
              Redirigiendo al login automáticamente…
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Renovar (solo si hay email conocido) */}
              {userEmail && (
                <button
                  onClick={() => { setMode('renew'); }}
                  style={{
                    width: '100%', padding: '12px 24px',
                    borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#0E9B8A,#0a7a6a)',
                    color: 'white', fontWeight: 700, fontSize: '0.9375rem',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(14,155,138,0.30)',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>key</span>
                  Renovar sesión
                </button>
              )}

              {/* Cerrar sesión */}
              <button
                onClick={goLogin}
                style={{
                  width: '100%', padding: '12px 24px',
                  borderRadius: 12,
                  border: '1.5px solid rgba(26,78,215,0.25)',
                  background: 'transparent',
                  color: '#1a4ed7', fontWeight: 700, fontSize: '0.9375rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,78,215,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>logout</span>
                Cerrar sesión
              </button>
            </div>
          </>
        )}

        {/* ── MODO RENOVAR ── */}
        {mode === 'renew' && (
          <form onSubmit={handleRenew} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Email — solo lectura */}
            {userEmail && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(14,155,138,0.05)',
                border: '1px solid rgba(14,155,138,0.18)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0E9B8A' }}>person</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{userEmail}</span>
              </div>
            )}

            {/* Contraseña */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                autoFocus
                placeholder="Ingresa tu contraseña…"
                style={{
                  width: '100%', padding: '10px 14px',
                  borderRadius: 10, border: `1.5px solid ${loginError ? '#dc2626' : 'rgba(197,198,210,0.6)'}`,
                  fontSize: '0.9375rem', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms',
                }}
                onFocus={e => { if (!loginError) e.target.style.borderColor = '#1a4ed7'; }}
                onBlur={e => { if (!loginError) e.target.style.borderColor = 'rgba(197,198,210,0.6)'; }}
              />
              {loginError && (
                <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                  {loginError}
                </p>
              )}
            </div>

            {/* Botones */}
            <button
              type="submit"
              disabled={logging}
              style={{
                width: '100%', padding: '12px 24px',
                borderRadius: 12, border: 'none',
                background: logging ? '#94a3b8' : 'linear-gradient(135deg,#0E9B8A,#0a7a6a)',
                color: 'white', fontWeight: 700, fontSize: '0.9375rem',
                cursor: logging ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: logging ? 'none' : '0 4px 16px rgba(14,155,138,0.30)',
                transition: 'all 200ms',
              }}
            >
              {logging
                ? <><span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>progress_activity</span>Verificando…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>Confirmar y continuar</>
              }
            </button>

            <button
              type="button"
              onClick={() => { setMode('notice'); setPassword(''); setLoginError(''); }}
              style={{
                width: '100%', padding: '10px',
                borderRadius: 12, border: 'none',
                background: 'transparent',
                color: '#64748b', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'color 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a4ed7'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
              ← Volver
            </button>

          </form>
        )}

      </div>

      <style>{`
        @keyframes sessFadeIn  { from{opacity:0}                                   to{opacity:1} }
        @keyframes sessSlideUp { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>,
    document.body
  );
}
