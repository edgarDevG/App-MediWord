import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPass,  setFocusPass]  = useState(false);

  const { login }      = useAuth();
  const navigate       = useNavigate();
  const { showToast }  = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Sesión iniciada correctamente', 'success');
      navigate('/');
    } catch {
      showToast('Credenciales inválidas. Verifica tus datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes lgn-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .lgn-spin { animation: lgn-spin 1s linear infinite; }

        @keyframes lgn-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lgn-in { animation: lgn-in 0.45s cubic-bezier(0.16,1,0.3,1) both; }

        @media (max-width: 720px) {
          .lgn-left  { display: none !important; }
          .lgn-right { border-radius: 0 !important; min-height: 100dvh !important; }
        }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100dvh',
        background: '#EEF1F5',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'Inter, sans-serif',
      }}>

        {/* ── Card wrapper ── */}
        <div className="lgn-in" style={{
          display: 'flex',
          width: '100%', maxWidth: 880,
          minHeight: 560,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(7,15,26,0.18), 0 4px 16px rgba(7,15,26,0.1)',
        }}>

          {/* ════════════════════════════════
              PANEL IZQUIERDO — Branding
          ════════════════════════════════ */}
          <div className="lgn-left" style={{
            flex: '0 0 340px',
            background: 'linear-gradient(160deg, #070f1a 0%, #0A2540 60%, #0d2f4c 100%)',
            display: 'flex', flexDirection: 'column',
            padding: '3rem 2.5rem',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* dot grid */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.05,
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }} />
            {/* glow orb top-right */}
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 260, height: 260,
              background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
            }} />
            {/* glow orb bottom-left */}
            <div style={{
              position: 'absolute', bottom: -40, left: -40,
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(26,78,215,0.15) 0%, transparent 70%)',
            }} />

            {/* Logo */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                }}>
                  <svg viewBox="0 0 32 32" fill="none" width="20" height="20">
                    <rect x="13" y="4" width="6" height="24" rx="2" fill="white"/>
                    <rect x="4" y="13" width="24" height="6" rx="2" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>MediWord HSM</div>
                  <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                   Hospital Serena del Mar
                  </div>
                </div>
              </div>
            </div>

            {/* Center content */}
            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', marginBottom: 'auto', paddingTop: '3rem' }}>
              <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 14 }}>
                Sistema de Gestión<br />del Cuerpo Médico
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
                Administra contrataciones, habilitaciones, normativos y estadísticas del personal médico en un solo lugar.
              </p>

              {/* feature pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
                {[
                  { icon: 'verified_user',         text: 'Control de habilitaciones' },
                  { icon: 'notification_important', text: 'Alertas de vencimiento'    },
                  { icon: 'insert_chart',           text: 'Reportes exportables'      },
                ].map(f => (
                  <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#10b981' }}>{f.icon}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              position: 'relative', zIndex: 1,
              borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, marginTop: 'auto',
            }}>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                Hospital Serena del Mar<br />
                Dirección Médica · v2.0
              </p>
            </div>
          </div>

          {/* ════════════════════════════════
              PANEL DERECHO — Formulario
          ════════════════════════════════ */}
          <div className="lgn-right" style={{
            flex: 1, background: 'white',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            padding: '3rem 3rem',
            minWidth: 0,
          }}>
            {/* Heading */}
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#070f1a', lineHeight: 1.15, marginBottom: 8 }}>
                Bienvenido de vuelta
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.55 }}>
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Correo electrónico
                </label>
                <div style={{
                  position: 'relative',
                  borderRadius: 12,
                  border: `1.5px solid ${focusEmail ? '#0A2540' : 'rgba(197,198,210,0.6)'}`,
                  transition: 'border-color 160ms, box-shadow 160ms',
                  boxShadow: focusEmail ? '0 0 0 3px rgba(10,37,64,0.1)' : 'none',
                  background: '#f8fafc',
                }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 18, color: focusEmail ? '#0A2540' : '#94a3b8',
                    pointerEvents: 'none', transition: 'color 160ms',
                  }}>mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusEmail(true)}
                    onBlur={() => setFocusEmail(false)}
                    placeholder="usuario@chsm.com"
                    required
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px',
                      background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '0.9rem', color: '#070f1a',
                      fontFamily: 'Inter, sans-serif',
                      borderRadius: 12,
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Contraseña
                </label>
                <div style={{
                  position: 'relative',
                  borderRadius: 12,
                  border: `1.5px solid ${focusPass ? '#0A2540' : 'rgba(197,198,210,0.6)'}`,
                  transition: 'border-color 160ms, box-shadow 160ms',
                  boxShadow: focusPass ? '0 0 0 3px rgba(10,37,64,0.1)' : 'none',
                  background: '#f8fafc',
                }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 18, color: focusPass ? '#0A2540' : '#94a3b8',
                    pointerEvents: 'none', transition: 'color 160ms',
                  }}>lock</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusPass(true)}
                    onBlur={() => setFocusPass(false)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%', padding: '13px 46px 13px 42px',
                      background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '0.9rem', color: '#070f1a',
                      fontFamily: 'Inter, sans-serif',
                      borderRadius: 12,
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: '#94a3b8', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  width: '100%', padding: '14px',
                  background: loading ? '#334155' : 'linear-gradient(155deg,#0a2463 0%,#0A2540 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: '0.9375rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(10,37,64,0.3)',
                  transition: 'all 160ms ease',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 22px rgba(10,37,64,0.4)'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,37,64,0.3)'; }}
              >
                {loading
                  ? <><span className="material-symbols-outlined lgn-spin" style={{ fontSize: 18 }}>progress_activity</span>Ingresando…</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>Iniciar Sesión</>
                }
              </button>
            </form>

            {/* Forgot password */}
            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowHelp(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: '#64748b', fontSize: '0.8125rem',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'Inter, sans-serif',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>help_outline</span>
                ¿Olvidaste tu contraseña?
              </button>

              {showHelp && (
                <div style={{
                  marginTop: 12, padding: '14px 16px',
                  background: 'rgba(10,37,64,0.04)',
                  border: '1px solid rgba(10,37,64,0.1)',
                  borderRadius: 12,
                  borderLeft: '3px solid #0A2540',
                }}>
                  <p style={{ fontWeight: 700, color: '#0A2540', fontSize: '0.8125rem', marginBottom: 5 }}>
                    Contacta al administrador del sistema
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.6 }}>
                    Solicita el restablecimiento de tus credenciales por correo.
                    El administrador te enviará una nueva contraseña.
                  </p>
                  <p style={{ color: '#0A2540', fontSize: '0.75rem', marginTop: 8, fontWeight: 600 }}>
                    Dirección Médica · Hospital Serena del Mar
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
