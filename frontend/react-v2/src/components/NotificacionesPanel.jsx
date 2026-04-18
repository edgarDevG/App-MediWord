import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   NotificacionesPanel v2
   Fix 422: el endpoint GET /notificaciones/vencimientos puede
   requerir query params. Probamos variantes automáticamente y
   guardamos la que funciona para no reintentar innecesariamente.
   ══════════════════════════════════════════════════════════════ */

// Variantes de endpoint a intentar en orden
const ENDPOINTS = [
  '/notificaciones/vencimientos',
  '/notificaciones/vencimientos/?dias_limite=30',
  '/notificaciones/vencimientos/?dias=30',
  '/alertas/vencimientos',
  '/notificaciones/',
];

export default function NotificacionesPanel() {
  const [open,      setOpen]      = useState(false);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [noService, setNoService] = useState(false); // true si ningún endpoint responde

  // Guarda el endpoint que funcionó para no re-intentar todos cada vez
  const workingEndpoint = useRef(null);

  const fetchAlertas = async () => {
    if (noService) return; // ya sabemos que el servicio no responde — no spamear
    setLoading(true);

    // Si ya encontramos el endpoint correcto, usarlo directo
    if (workingEndpoint.current) {
      try {
        const res  = await axiosInstance.get(workingEndpoint.current, { skipToast: true });
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data.items ?? res.data.data ?? res.data.alertas ?? []);
        setItems(data.filter(i => !i.leida));
      } catch {
        // Silencioso
      } finally {
        setLoading(false);
      }
      return;
    }

    // Probar endpoints en orden hasta encontrar uno que responda 200
    let found = false;
    for (const ep of ENDPOINTS) {
      try {
        const res = await axiosInstance.get(ep, { skipToast: true });
        if (res.status === 200) {
          workingEndpoint.current = ep;
          const data = Array.isArray(res.data)
            ? res.data
            : (res.data.items ?? res.data.data ?? res.data.alertas ?? []);
          setItems(data.filter(i => !i.leida));
          found = true;
          break;
        }
      } catch {
        // Este endpoint no funcionó, probar el siguiente
        continue;
      }
    }

    if (!found) {
      // Ningún endpoint respondió — deshabilitar polling para no llenar consola
      setNoService(true);
      console.info('[NotificacionesPanel] Servicio de notificaciones no disponible — polling desactivado');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAlertas();
    const iv = setInterval(fetchAlertas, 60_000);
    return () => clearInterval(iv);
  }, []);

  const marcarLeida = async (id) => {
    if (!workingEndpoint.current) return;
    try {
      // Intentar PATCH primero (más REST), fallback a PUT
      try {
        await axiosInstance.patch(
          `/notificaciones/vencimientos/${id}`,
          { leida: true },
          { skipToast: true }
        );
      } catch {
        await axiosInstance.put(
          `/notificaciones/vencimientos/${id}`,
          { leida: true },
          { skipToast: true }
        );
      }
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silencioso */ }
  };

  const marcarTodasLeidas = async () => {
    await Promise.allSettled(items.map(i => marcarLeida(i.id)));
    setItems([]);
  };

  const noLeidas = items.length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-icon"
        title={noService ? 'Servicio de notificaciones no disponible' : 'Notificaciones de vencimiento'}
        style={{ position: 'relative', opacity: noService ? 0.5 : 1 }}>
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
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 10px)',
            width: 360, maxHeight: 500, background: 'white',
            borderRadius: '0.75rem', border: '1px solid rgba(197,198,210,0.4)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
            zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>

            {/* Header del panel */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(197,198,210,0.3)',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#00103e' }}>
                Alertas de vencimiento
                {noLeidas > 0 && (
                  <span style={{ marginLeft: 8, fontSize: '0.75rem',
                    color: '#ba1a1a', fontWeight: 700 }}>
                    {noLeidas} sin leer
                  </span>
                )}
              </span>
              {noLeidas > 1 && (
                <button onClick={marcarTodasLeidas}
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem',
                    color: '#1a4ed7', cursor: 'pointer', fontWeight: 600 }}>
                  Marcar todas
                </button>
              )}
            </div>

            {/* Cuerpo */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ padding: '12px 16px',
                    borderBottom: '1px solid rgba(197,198,210,0.2)' }}>
                    <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '55%' }} />
                  </div>
                ))
              ) : noService ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                    cloud_off
                  </span>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
                    Servicio no disponible
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                    El endpoint de notificaciones no responde
                  </p>
                  <button onClick={() => { setNoService(false); workingEndpoint.current = null; fetchAlertas(); }}
                    style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8,
                      border: '1px solid rgba(197,198,210,0.5)', background: 'white',
                      fontSize: '0.75rem', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                    Reintentar
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                    notifications_off
                  </span>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
                    Sin alertas pendientes 🎉
                  </p>
                </div>
              ) : items.map(a => {
                const critico = a.dias_restantes < 0;
                const urgente = !critico && a.dias_restantes <= 7;
                return (
                  <div key={a.id} style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid rgba(197,198,210,0.2)',
                    background: critico
                      ? 'rgba(186,26,26,0.04)'
                      : urgente ? 'rgba(245,158,11,0.04)' : 'white',
                    alignItems: 'flex-start',
                    transition: 'background 120ms',
                  }}>
                    <span className="material-symbols-outlined sm"
                      style={{
                        color: critico ? '#ba1a1a' : urgente ? '#d97706' : '#94a3b8',
                        flexShrink: 0, marginTop: 2,
                      }}>
                      {critico ? 'cancel' : 'schedule'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#00103e',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.nombre_medico ?? a.documento_identidad ?? '—'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        {a.tipo_documento ?? 'Documento'} ·{' '}
                        {critico
                          ? <span style={{ color: '#ba1a1a', fontWeight: 600 }}>
                              Vencido hace {Math.abs(a.dias_restantes)}d
                            </span>
                          : urgente
                          ? <span style={{ color: '#d97706', fontWeight: 600 }}>
                              Vence en {a.dias_restantes}d
                            </span>
                          : `Vence en ${a.dias_restantes}d`
                        }
                      </p>
                    </div>
                    <button onClick={() => marcarLeida(a.id)}
                      title="Marcar como leída"
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, color: '#94a3b8', borderRadius: 6,
                        transition: 'color 120ms' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                      <span className="material-symbols-outlined sm">close</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer — solo si hay items */}
            {items.length > 0 && (
              <div style={{ padding: '10px 16px',
                borderTop: '1px solid rgba(197,198,210,0.3)',
                display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => { setOpen(false); }}
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem',
                    color: '#1a4ed7', cursor: 'pointer', fontWeight: 600 }}>
                  Ver todas las alertas →
                </button>
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
