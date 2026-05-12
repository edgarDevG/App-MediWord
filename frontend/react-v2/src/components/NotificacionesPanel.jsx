import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   NotificacionesPanel v3 — una notificación por médico
   ══════════════════════════════════════════════════════════════ */

const NIVEL = {
  critico: { color: '#ba1a1a', bg: 'rgba(186,26,26,0.07)', badge: '#ba1a1a', label: 'Vencido',   icon: 'cancel'   },
  urgente: { color: '#b45309', bg: 'rgba(180,83,9,0.06)',  badge: '#d97706', label: 'Urgente',   icon: 'warning'  },
  proximo: { color: '#1a4ed7', bg: 'rgba(26,78,215,0.05)', badge: '#1a4ed7', label: 'Por vencer', icon: 'schedule' },
};

function initials(name) {
  if (!name) return '?';
  const clean = name.replace(/^Dr[a]?\.?\s+/i, '').trim();
  return clean.split(/\s+/).slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase() || '?';
}

const AVATAR_PALETTE = [
  { bg: 'rgba(26,78,215,0.12)',   color: '#1a4ed7' },
  { bg: 'rgba(6,95,70,0.12)',     color: '#065f46' },
  { bg: 'rgba(109,40,217,0.12)', color: '#6d28d9' },
  { bg: 'rgba(180,83,9,0.12)',   color: '#b45309' },
  { bg: 'rgba(186,26,26,0.12)',  color: '#ba1a1a' },
];

function avatarColor(nombre) {
  const code = (nombre ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

export default function NotificacionesPanel() {
  const navigate = useNavigate();
  const [open,      setOpen]      = useState(false);
  const [items,     setItems]     = useState([]);
  const [descartados, setDesc]    = useState(new Set());
  const [loading,   setLoading]   = useState(false);
  const [noService, setNoService] = useState(false);

  const fetchAlertas = async () => {
    if (noService) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/notificaciones/resumen-medico?dias_limite=30', { skipToast: true });
      const data = Array.isArray(res.data) ? res.data : (res.data.items ?? []);
      setItems(data);
    } catch {
      setNoService(true);
      console.info('[NotificacionesPanel] Servicio no disponible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
    const iv = setInterval(fetchAlertas, 60_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibles = items.filter(i => !descartados.has(i.documento_identidad));
  const noLeidas = visibles.length;

  const descartar = (e, doc) => {
    e.stopPropagation();
    setDesc(prev => new Set([...prev, doc]));
  };

  const descartarTodas = () => setDesc(new Set(items.map(i => i.documento_identidad)));

  const irAlPerfil = (item) => {
    const ruta = item.tipo_listado === 'fsfb_externo'
      ? `/medicos-fsfb/${item.documento_identidad}/perfil`
      : `/medicos/${item.documento_identidad}/perfil`;
    navigate(ruta);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Botón campana ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-icon"
        title={noService ? 'Servicio de alertas no disponible' : 'Alertas de vencimiento'}
        style={{ position: 'relative', opacity: noService ? 0.5 : 1 }}
      >
        <span className="material-symbols-outlined">
          {noService ? 'notifications_off' : 'notifications'}
        </span>
        {noLeidas > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 9999,
            background: '#ba1a1a', color: 'white',
            fontSize: '0.6875rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1, boxShadow: '0 0 0 2px white',
            animation: 'pulse 2s infinite',
          }}>
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 10px)',
            width: 380, maxHeight: 520, background: 'white',
            borderRadius: '0.875rem', border: '1px solid rgba(197,198,210,0.4)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.13)',
            zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>

            {/* ── Header ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid rgba(197,198,210,0.25)',
              background: '#fcfcfd',
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#00103e' }}>
                  Alertas de vencimiento
                </span>
                {noLeidas > 0 && (
                  <span style={{
                    marginLeft: 8, fontSize: '0.6875rem', fontWeight: 700,
                    color: '#ba1a1a', background: 'rgba(186,26,26,0.08)',
                    padding: '2px 8px', borderRadius: 9999,
                  }}>
                    {noLeidas} {noLeidas === 1 ? 'médico' : 'médicos'}
                  </span>
                )}
              </div>
              {noLeidas > 1 && (
                <button onClick={descartarTodas} style={{
                  background: 'none', border: 'none', fontSize: '0.75rem',
                  color: '#64748b', cursor: 'pointer', fontWeight: 600,
                }}>
                  Limpiar todo
                </button>
              )}
            </div>

            {/* ── Cuerpo ── */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(197,198,210,0.2)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 13, borderRadius: 6, marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 10, borderRadius: 6, width: '70%' }} />
                    </div>
                  </div>
                ))
              ) : noService ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }}>cloud_off</span>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>Servicio no disponible</p>
                  <button onClick={() => { setNoService(false); fetchAlertas(); }} style={{
                    marginTop: 12, padding: '6px 14px', borderRadius: 8,
                    border: '1px solid rgba(197,198,210,0.5)', background: 'white',
                    fontSize: '0.75rem', color: '#475569', cursor: 'pointer', fontWeight: 600,
                  }}>
                    Reintentar
                  </button>
                </div>
              ) : visibles.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }}>check_circle</span>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>Sin alertas pendientes</p>
                  <p style={{ fontSize: '0.75rem', color: '#b0bec5', marginTop: 4 }}>Todos los documentos están al día</p>
                </div>
              ) : visibles.map(item => {
                const nv = NIVEL[item.nivel] ?? NIVEL.proximo;
                const av = avatarColor(item.nombre_medico);
                const nombreCorto = (item.nombre_medico ?? '').replace(/^Dr[a]?\.?\s+/i, '').split(' ').slice(0, 3).join(' ');
                return (
                  <div
                    key={item.documento_identidad}
                    onClick={() => irAlPerfil(item)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '13px 16px',
                      borderBottom: '1px solid rgba(197,198,210,0.18)',
                      background: nv.bg,
                      cursor: 'pointer', transition: 'filter 120ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.97)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: av.bg, color: av.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800, letterSpacing: '-0.02em',
                    }}>
                      {initials(item.nombre_medico)}
                    </div>

                    {/* Contenido */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <p style={{
                          fontSize: '0.8125rem', fontWeight: 700, color: '#00103e',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, minWidth: 0, margin: 0,
                        }}>
                          {nombreCorto}
                        </p>
                        {/* Badge nivel */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: '0.625rem', fontWeight: 700, flexShrink: 0,
                          color: nv.badge,
                          background: `${nv.badge}18`,
                          padding: '2px 7px', borderRadius: 9999,
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>{nv.icon}</span>
                          {nv.label}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.6875rem', color: '#64748b', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}>
                        {item.resumen}
                      </p>
                      <p style={{ fontSize: '0.625rem', color: '#94a3b8', margin: '3px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                        {item.total_alertas} {item.total_alertas === 1 ? 'alerta' : 'alertas'} · Toca para ver el perfil
                      </p>
                    </div>

                    {/* Descartar */}
                    <button
                      onClick={e => descartar(e, item.documento_identidad)}
                      title="Descartar"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, color: '#94a3b8', borderRadius: 6,
                        flexShrink: 0, transition: 'color 120ms',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <span className="material-symbols-outlined sm">close</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Footer ── */}
            {visibles.length > 0 && (
              <div style={{
                padding: '10px 16px', borderTop: '1px solid rgba(197,198,210,0.25)',
                background: '#fcfcfd', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.6875rem', color: '#94a3b8', margin: 0 }}>
                  Alertas de los próximos 30 días · Se actualiza cada minuto
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px white; }
          50%       { box-shadow: 0 0 0 4px rgba(186,26,26,0.3); }
        }
      `}</style>
    </div>
  );
}
