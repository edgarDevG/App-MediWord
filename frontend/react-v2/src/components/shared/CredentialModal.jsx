import { useState } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   CredentialModal — Validación por credenciales admin/supervisor
   Se usa para acciones sensibles: eliminación de médicos y
   reversión de normativos.
   ══════════════════════════════════════════════════════════════ */

export default function CredentialModal({
  title = 'Autorización requerida',
  description = 'Ingresa las credenciales de un usuario con rol Administrador o Supervisor para confirmar esta acción.',
  icon = 'shield_person',
  iconColor = '#7f1d1d',
  iconBg = '#fef2f2',
  confirmLabel = 'Confirmar',
  confirmColor = '#7f1d1d',
  requiredRoles = ['admin', 'supervisor'],
  onSuccess,
  onClose,
}) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completa ambos campos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/verify-credentials', {
        email: email.trim(),
        password,
        required_roles: requiredRoles,
      }, { skipToast: true });

      setSuccess(`✓ Autorizado por ${res.data.user.nombre || res.data.user.username} (${res.data.user.rol})`);

      // Pequeña pausa visual antes de cerrar
      setTimeout(() => {
        onSuccess?.(res.data.user);
      }, 600);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Error al validar credenciales.');
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        background: 'rgba(0,16,62,0.50)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'credFadeIn 200ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 20,
          padding: '2rem', width: '100%', maxWidth: 400,
          boxShadow: '0 24px 48px rgba(0,16,62,0.22)',
          animation: 'credSlideUp 250ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 24, color: iconColor,
              fontVariationSettings: "'FILL' 1",
            }}>{icon}</span>
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#00103e', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '3px 0 0', lineHeight: 1.4 }}>
              {description}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Rol badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px',
            background: 'rgba(26,78,215,0.04)',
            border: '1px solid rgba(26,78,215,0.12)',
            borderRadius: 10,
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 14, color: '#1a4ed7',
              fontVariationSettings: "'FILL' 1",
            }}>verified_user</span>
            <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 500 }}>
              Roles autorizados:{' '}
              {requiredRoles.map(r => (
                <span key={r} style={{
                  display: 'inline-block',
                  padding: '1px 8px', borderRadius: 9999, marginLeft: 4,
                  background: 'rgba(26,78,215,0.08)',
                  color: '#1a4ed7', fontWeight: 700, fontSize: '0.6875rem',
                  textTransform: 'capitalize',
                }}>{r}</span>
              ))}
            </span>
          </div>

          {/* Email */}
          <div>
            <label style={{
              fontSize: '0.6875rem', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'block', marginBottom: 6,
            }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: '#94a3b8', pointerEvents: 'none',
              }}>mail</span>
              <input
                type="email" autoComplete="email" autoFocus
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="usuario@hospital.com"
                disabled={loading || !!success}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  border: '1.5px solid rgba(197,198,210,0.4)',
                  borderRadius: 10, fontSize: '0.875rem',
                  outline: 'none', boxSizing: 'border-box',
                  background: success ? '#f0fdf4' : '#fff',
                  transition: 'all 150ms',
                }}
                onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(197,198,210,0.4)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{
              fontSize: '0.6875rem', fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'block', marginBottom: 6,
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: '#94a3b8', pointerEvents: 'none',
              }}>lock</span>
              <input
                type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                disabled={loading || !!success}
                style={{
                  width: '100%', padding: '10px 42px 10px 38px',
                  border: '1.5px solid rgba(197,198,210,0.4)',
                  borderRadius: 10, fontSize: '0.875rem',
                  outline: 'none', boxSizing: 'border-box',
                  background: success ? '#f0fdf4' : '#fff',
                  transition: 'all 150ms',
                }}
                onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(197,198,210,0.4)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, display: 'flex', color: '#94a3b8',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {showPwd ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px',
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 10,
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 16, color: '#dc2626', flexShrink: 0,
                fontVariationSettings: "'FILL' 1",
              }}>error</span>
              <p style={{ fontSize: '0.8125rem', color: '#dc2626', margin: 0, fontWeight: 500 }}>
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px',
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: 10,
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 16, color: '#16a34a', flexShrink: 0,
                fontVariationSettings: "'FILL' 1",
              }}>check_circle</span>
              <p style={{ fontSize: '0.8125rem', color: '#16a34a', margin: 0, fontWeight: 600 }}>
                {success}
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || !!success}
              style={{
                padding: '9px 22px', borderRadius: 10,
                border: '1px solid rgba(197,198,210,0.5)',
                background: 'white', color: '#374151',
                fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              style={{
                padding: '9px 22px', borderRadius: 10,
                border: 'none',
                background: success ? '#16a34a' : confirmColor,
                color: 'white', fontWeight: 700, fontSize: '0.875rem',
                cursor: loading || success ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 200ms',
              }}
            >
              {loading && (
                <span className="material-symbols-outlined" style={{
                  fontSize: 16, animation: 'spin 1s linear infinite',
                }}>progress_activity</span>
              )}
              {success ? 'Autorizado' : confirmLabel}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes credFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes credSlideUp{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>,
    document.body
  );
}
