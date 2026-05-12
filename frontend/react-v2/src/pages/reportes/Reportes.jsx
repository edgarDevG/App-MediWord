/* ══════════════════════════════════════════════════════════════
   Reportes.jsx v3 — MediWork HSM — Premium Design
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

/* ── Nivel severity config ──────────────────────────────────── */
const NIVEL_CFG = {
  critico: { label: 'Crítico',  bg: 'rgba(220,38,38,0.1)',   color: '#dc2626', icon: 'error',    border: '#dc2626' },
  urgente: { label: 'Urgente',  bg: 'rgba(245,158,11,0.1)',  color: '#d97706', icon: 'schedule', border: '#f59e0b' },
  proximo: { label: 'Próximo',  bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', icon: 'info',     border: '#3b82f6' },
};

/* ── Avatar palette + helpers ───────────────────────────────── */
const AVATAR_PAL = ['#1a4ed7','#0A7E6E','#7c3aed','#db2777','#d97706','#059669','#dc2626','#0891b2'];

function avatarColor(name = '') {
  const h = [...name].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7);
  return AVATAR_PAL[Math.abs(h) % AVATAR_PAL.length];
}

function avatarInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Estado chart palette ───────────────────────────────────── */
const ESTADO_COLORS = {
  activos:     { color: '#0A7E6E', grad: 'linear-gradient(90deg,#0A7E6E,#0e9b8a)',   label: 'Activos'     },
  en_proceso:  { color: '#3b82f6', grad: 'linear-gradient(90deg,#1a4ed7,#3b82f6)',   label: 'En proceso'  },
  finalizados: { color: '#6366f1', grad: 'linear-gradient(90deg,#4f46e5,#6366f1)',   label: 'Finalizados' },
  renuncias:   { color: '#f59e0b', grad: 'linear-gradient(90deg,#d97706,#f59e0b)',   label: 'Renuncias'   },
  inactivos:   { color: '#94a3b8', grad: 'linear-gradient(90deg,#64748b,#94a3b8)',   label: 'Inactivos'   },
};

/* ── Helpers ────────────────────────────────────────────────── */
const safe = (v) => (v == null || v === '') ? 0 : Number(v);

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ══════════════════════════════════════════════════════════════ */

function KpiCard({ label, valor, icon, accentColor, sub, subColor, alert, loading }) {
  const [hover, setHover] = useState(false);
  if (loading) return <div className="skeleton" style={{ height: 114, borderRadius: 16, flex: '1 1 160px' }} />;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'white', borderRadius: 16,
        padding: '20px 22px',
        boxShadow: hover
          ? '0 8px 32px rgba(0,16,62,0.12),0 0 0 1px rgba(26,78,215,0.12)'
          : '0 2px 8px rgba(0,16,62,0.06),0 0 0 1px rgba(197,198,210,0.2)',
        display: 'flex', flexDirection: 'column', gap: 5,
        position: 'relative', overflow: 'hidden',
        flex: '1 1 160px', minWidth: 0,
        transition: 'box-shadow 200ms,transform 200ms',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentColor, borderRadius: '16px 16px 0 0',
      }} />
      <div style={{
        position: 'absolute', right: 18, top: 18,
        width: 38, height: 38, borderRadius: 10,
        background: `${accentColor}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
        {label}
      </p>
      <span style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, color: alert ? '#dc2626' : '#00103e', fontVariantNumeric: 'tabular-nums' }}>
        {valor ?? '—'}
      </span>
      {sub && (
        <p style={{ fontSize: '0.75rem', color: subColor ?? '#94a3b8', fontWeight: 500, lineHeight: 1.2, marginTop: 1 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function BarChart({ datos, total, loading }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { if (!loading) { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); } }, [loading]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[70, 45, 30, 20, 15].map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4, flexShrink: 0 }} />
          <div className="skeleton" style={{ flex: `0 0 ${w}%`, height: 22, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 28, height: 12, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );

  if (!total) return (
    <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Sin datos disponibles</p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(ESTADO_COLORS).map(([key, cfg]) => {
        const valor = safe(datos[key]);
        const pct   = total > 0 ? (valor / total) * 100 : 0;
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 86, flexShrink: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
              {cfg.label}
            </span>
            <div style={{ flex: 1, height: 22, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: mounted && pct > 0 ? `${Math.max(pct, 2)}%` : '0%',
                background: cfg.grad, borderRadius: 8,
                transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
            <span style={{ width: 32, flexShrink: 0, fontSize: '0.875rem', fontWeight: 700, color: valor > 0 ? cfg.color : '#cbd5e1', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {valor}
            </span>
            <span style={{ width: 46, flexShrink: 0, fontSize: '0.75rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
              {pct > 0 ? `${pct.toFixed(1)}%` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AlertDoctorCard({ item, onNavigate }) {
  const [hover, setHover] = useState(false);
  const cfg = NIVEL_CFG[item.nivel] ?? NIVEL_CFG.proximo;
  const initials = avatarInitials(item.nombre_medico ?? '');
  const color    = avatarColor(item.nombre_medico ?? '');

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onNavigate(item)}
      style={{
        background: 'white',
        border: `1px solid ${hover ? cfg.border + '40' : 'rgba(197,198,210,0.2)'}`,
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: 14, padding: '14px 16px',
        boxShadow: hover ? '0 6px 24px rgba(0,16,62,0.1)' : '0 1px 4px rgba(0,16,62,0.05)',
        transition: 'all 180ms ease',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8125rem', fontWeight: 700, color: 'white', letterSpacing: '0.02em',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#00103e', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.nombre_medico ?? '—'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 9999,
            fontSize: '0.5625rem', fontWeight: 700,
            background: cfg.bg, color: cfg.color,
            textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>{cfg.icon}</span>
            {cfg.label}
          </span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: item.vencidos > 0 ? '#dc2626' : '#94a3b8', flexShrink: 0 }}>
            {item.total_alertas} doc{item.total_alertas !== 1 ? 's' : '.'}
          </span>
        </div>
        <p style={{
          fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {item.resumen}
        </p>
      </div>
    </div>
  );
}

function ExportCard({ icon, title, description, buttonLabel, buttonIcon, grad, loading, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'white',
        border: `1px solid ${hover ? 'rgba(26,78,215,0.18)' : 'rgba(197,198,210,0.25)'}`,
        borderRadius: 16, padding: '24px',
        boxShadow: hover ? '0 8px 32px rgba(0,16,62,0.1)' : '0 2px 8px rgba(0,16,62,0.05)',
        display: 'flex', flexDirection: 'column', gap: 16,
        flex: '1 1 220px', minWidth: 0,
        transition: 'all 200ms ease',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>{description}</p>
      </div>
      <button onClick={onClick} disabled={loading} className="btn btn-signature" style={{ alignSelf: 'flex-start' }}>
        {loading ? (
          <><span className="material-symbols-outlined sm rpt-spin">progress_activity</span>Generando…</>
        ) : (
          <><span className="material-symbols-outlined sm">{buttonIcon}</span>{buttonLabel}</>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export default function Reportes() {
  const navigate = useNavigate();

  const [totales,    setTotales]    = useState(null);
  const [alertas,    setAlertas]    = useState([]);
  const [loadKpi,    setLoadKpi]    = useState(true);
  const [loadAlert,  setLoadAlert]  = useState(true);
  const [errorKpi,   setErrorKpi]   = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);
  const [dlCompleto, setDlCompleto] = useState(false);
  const [dlAlerts,   setDlAlerts]   = useState(false);
  const [dlPdf,      setDlPdf]      = useState(false);

  useEffect(() => {
    setLoadKpi(true);
    axiosInstance
      .get('/dashboard/resumen/', { skipToast: true })
      .then(r => setTotales(r.data?.totales ?? r.data ?? {}))
      .catch(() => setErrorKpi('No se pudieron cargar los indicadores.'))
      .finally(() => setLoadKpi(false));
  }, []);

  useEffect(() => {
    setLoadAlert(true);
    axiosInstance
      .get('/notificaciones/resumen-medico?dias_limite=30', { skipToast: true })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setAlertas(data);
      })
      .catch(() => setErrorAlert('No se pudieron cargar las alertas.'))
      .finally(() => setLoadAlert(false));
  }, []);

  const handleDownload = async (endpoint, filename, setLoading) => {
    setLoading(true);
    try {
      const res  = await axiosInstance.get(endpoint, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert(`Error al descargar ${filename}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  const irAlPerfil = (item) => {
    const ruta = item.tipo_listado === 'fsfb_externo'
      ? `/medicos-fsfb/${item.documento_identidad}/perfil`
      : `/medicos/${item.documento_identidad}/perfil`;
    navigate(ruta);
  };

  /* ── Datos derivados ── */
  const tot          = totales ?? {};
  const totalMedicos = safe(tot.total_medicos ?? tot.total);
  const activos      = safe(tot.activos);
  const enProceso    = safe(tot.en_proceso);
  const finalizados  = safe(tot.finalizados);
  const renuncias    = safe(tot.renuncias);
  const inactivos    = safe(tot.inactivos);
  const hsmTotal     = safe(tot.hsm_total);
  const hsmActivos   = safe(tot.hsm_activos);
  const fsfbTotal    = safe(tot.fsfb_total);
  const fsfbActivos  = safe(tot.fsfb_activos);

  const criticos   = alertas.filter(a => a.nivel === 'critico').length;
  const urgentes   = alertas.filter(a => a.nivel === 'urgente').length;
  const chartTotal = activos + finalizados + renuncias + inactivos + enProceso || totalMedicos;

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes rpt-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .rpt-spin { animation: rpt-spin 1s linear infinite; }
      `}</style>

      <div style={{ minHeight: '100%', width: '100%' }}>

        {/* ── HERO HEADER ─────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg,#070f1a 0%,#0A2540 55%,#0d2f4c 100%)',
          padding: '2rem 2.5rem 2.25rem',
          position: 'relative', overflow: 'hidden',
          marginBottom: 28,
        }}>
          {/* dot grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          {/* glow orb */}
          <div style={{
            position: 'absolute', right: -80, top: -60,
            width: 360, height: 360,
            background: 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(13,47,76,0.15))',
            borderRadius: '50%', filter: 'blur(60px)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>insert_chart</span>
                  </div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                    Reportes &amp; Exportaciones
                  </h1>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', maxWidth: 520, lineHeight: 1.55 }}>
                  Indicadores operativos · Alertas de vencimiento · Herramientas de exportación
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '8px 14px',
                color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem',
                alignSelf: 'flex-start', whiteSpace: 'nowrap',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_today</span>
                {today}
              </div>
            </div>

            {/* mini stats strip */}
            {!loadKpi && !errorKpi && (
              <div style={{ display: 'flex', gap: 0, marginTop: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'HSM',     value: hsmTotal,       sub: `${hsmActivos} activos`               },
                  { label: 'FSFB',    value: fsfbTotal,      sub: `${fsfbActivos} activos`              },
                  { label: 'Alertas', value: alertas.length, sub: criticos > 0 ? `${criticos} críticas` : 'Sin críticas', alert: criticos > 0 },
                ].map((s, i) => (
                  <div key={s.label} style={{
                    display: 'flex', flexDirection: 'column', gap: 2,
                    paddingLeft: i > 0 ? 20 : 0, paddingRight: 20,
                    borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: '1.625rem', fontWeight: 800, color: s.alert ? '#fca5a5' : 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {s.value}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>{s.sub}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 2rem 2.5rem' }}>

          {/* ── 6 KPI CARDS ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
            {errorKpi ? (
              <div style={{
                flex: '1 1 100%', padding: '1rem 1.25rem',
                background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 12, color: '#dc2626', fontSize: '0.875rem',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span className="material-symbols-outlined sm">error</span>
                {errorKpi}
              </div>
            ) : (<>
              <KpiCard loading={loadKpi} label="Total Médicos"  valor={totalMedicos} icon="groups"       accentColor="#00103e"
                sub={!loadKpi ? `HSM: ${hsmTotal} · FSFB: ${fsfbTotal}` : null} />
              <KpiCard loading={loadKpi} label="Médicos Activos" valor={activos}     icon="verified_user" accentColor="#0A7E6E"
                sub={!loadKpi ? `${((activos/(totalMedicos||1))*100).toFixed(1)}% del total` : null} subColor="#0A7E6E" />
              <KpiCard loading={loadKpi} label="En Proceso"     valor={enProceso}   icon="pending"       accentColor="#3b82f6" />
              <KpiCard loading={loadKpi} label="Alertas Activas"
                valor={!loadAlert ? alertas.length : (safe(tot.alertas_vencimiento))}
                icon={criticos > 0 ? 'priority_high' : 'notifications'}
                accentColor={criticos > 0 ? '#dc2626' : '#f59e0b'}
                alert={criticos > 0}
                sub={!loadKpi && !loadAlert ? (criticos > 0 ? `${criticos} críticas · ${urgentes} urgentes` : 'Sin docs vencidos') : null}
                subColor={criticos > 0 ? '#dc2626' : '#0A7E6E'}
              />
              <KpiCard loading={loadKpi} label="Finalizados"    valor={finalizados} icon="event_busy"    accentColor="#6366f1" />
              <KpiCard loading={loadKpi} label="Renuncias"      valor={renuncias}   icon="exit_to_app"   accentColor="#f59e0b" />
            </>)}
          </div>

          {/* ── CHART + TIPO LISTADO ─────────────────────────────── */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>

            {/* bar chart */}
            <div style={{
              background: 'white',
              border: '1px solid rgba(197,198,210,0.25)',
              borderRadius: 16, padding: '22px 26px',
              boxShadow: '0 2px 8px rgba(0,16,62,0.05)',
              flex: '1 1 380px', minWidth: 0,
            }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', marginBottom: 4 }}>
                Distribución por Estado
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: 20 }}>
                Proporción de médicos según su estado en el sistema
              </p>
              <BarChart loading={loadKpi} datos={{ activos, finalizados, renuncias, inactivos, en_proceso: enProceso }} total={chartTotal} />
            </div>

            {/* HSM vs FSFB panel */}
            <div style={{
              background: 'linear-gradient(160deg,#070f1a 0%,#0A2540 100%)',
              borderRadius: 16, padding: '22px 24px',
              boxShadow: '0 4px 20px rgba(0,16,62,0.18)',
              flex: '0 1 300px', minWidth: 260,
              display: 'flex', flexDirection: 'column', gap: 16,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', bottom: -40, right: -40,
                width: 160, height: 160,
                background: 'rgba(26,78,215,0.15)', borderRadius: '50%',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white' }}>Tipo de Listado</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Origen permanente</p>
              </div>

              {/* HSM block */}
              <div style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '14px 16px', position: 'relative', zIndex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#10b981' }}>local_hospital</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Cuerpo Médico HSM</span>
                </div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {loadKpi ? '—' : hsmTotal}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Total</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {loadKpi ? '—' : hsmActivos}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Activos</div>
                  </div>
                </div>
              </div>

              {/* FSFB block */}
              <div style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '14px 16px', position: 'relative', zIndex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(26,78,215,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#93c5fd' }}>swap_horiz</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>FSFB Externos</span>
                </div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {loadKpi ? '—' : fsfbTotal}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Total</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#93c5fd', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {loadKpi ? '—' : fsfbActivos}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Activos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ALERTAS POR MÉDICO ───────────────────────────────── */}
          <div style={{
            background: 'white',
            border: '1px solid rgba(197,198,210,0.25)',
            borderRadius: 16, boxShadow: '0 2px 8px rgba(0,16,62,0.05)',
            marginBottom: 28, overflow: 'hidden',
          }}>
            {/* section header */}
            <div style={{
              padding: '16px 22px', borderBottom: '1px solid rgba(197,198,210,0.2)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(245,158,11,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#d97706', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notification_important</span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', lineHeight: 1.2 }}>
                  Alertas de Vencimiento por Médico
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 1 }}>
                  Documentos vencidos o próximos a vencer · Próximos 30 días · Clic para ir al perfil
                </p>
              </div>
              {!loadAlert && !errorAlert && alertas.length > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {criticos > 0 && (
                    <span style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '4px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {criticos} crítico{criticos !== 1 ? 's' : ''}
                    </span>
                  )}
                  {urgentes > 0 && (
                    <span style={{ background: 'rgba(245,158,11,0.12)', color: '#92400e', padding: '4px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {urgentes} urgente{urgentes !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {alertas.length} médico{alertas.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            <div style={{ padding: '18px 22px' }}>
              {loadAlert ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: 14, border: '1px solid rgba(197,198,210,0.2)', borderRadius: 14 }}>
                      <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="skeleton" style={{ height: 13, width: '60%', borderRadius: 4 }} />
                        <div className="skeleton" style={{ height: 10, width: '90%', borderRadius: 4 }} />
                        <div className="skeleton" style={{ height: 10, width: '70%', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : errorAlert ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined sm">error</span>
                  {errorAlert}
                </div>
              ) : alertas.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(5,150,105,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#059669' }}>check_circle</span>
                  </div>
                  <p style={{ fontWeight: 700, color: '#334155', fontSize: '0.9375rem' }}>Sin alertas pendientes</p>
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Todos los documentos están al día</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 10 }}>
                  {alertas.map((item, i) => (
                    <AlertDoctorCard key={i} item={item} onNavigate={irAlPerfil} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── EXPORTACIONES ───────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', marginBottom: 4 }}>
              Exportar Datos
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Descarga la información del cuerpo médico en diferentes formatos
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <ExportCard
              icon="table_view"
              title="Exportación Completa"
              description="Genera un archivo Excel (.xlsx) con todos los médicos, datos generales, estado e información de contacto."
              buttonLabel="Descargar Excel" buttonIcon="download"
              grad="linear-gradient(135deg,#0A7E6E,#0e9b8a)"
              loading={dlCompleto}
              onClick={() => handleDownload('/reportes/exportar', 'reporte_medicos.xlsx', setDlCompleto)}
            />
            <ExportCard
              icon="notification_important"
              title="Alertas de Vencimiento"
              description="Exporta la lista de documentos próximos a vencer o ya vencidos para gestión inmediata del equipo."
              buttonLabel="Descargar Excel" buttonIcon="download"
              grad="linear-gradient(135deg,#d97706,#f59e0b)"
              loading={dlAlerts}
              onClick={() => handleDownload('/reportes/exportar-alertas', 'alertas_vencimiento.xlsx', setDlAlerts)}
            />
            <ExportCard
              icon="picture_as_pdf"
              title="Reporte Ejecutivo PDF"
              description="Genera un reporte ejecutivo en PDF con indicadores clave, resumen estadístico y alertas prioritarias."
              buttonLabel="Descargar PDF" buttonIcon="picture_as_pdf"
              grad="linear-gradient(135deg,#4f46e5,#6366f1)"
              loading={dlPdf}
              onClick={() => handleDownload('/reportes/exportar-pdf', 'reporte_ejecutivo.pdf', setDlPdf)}
            />
          </div>

        </div>
      </div>
    </>
  );
}
