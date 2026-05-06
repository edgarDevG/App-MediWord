import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import MedicoTable, { EstadoBadge } from '../../components/shared/MedicoTable';

function TipoBadge({ tipo }) {
  const isHSM = tipo === 'cuerpo_medico';
  return (
    <span style={{
      fontSize: '0.625rem', fontWeight: 700,
      padding: '2px 7px', borderRadius: 9999,
      background: isHSM ? 'rgba(10,37,64,0.08)' : 'rgba(10,126,110,0.08)',
      color: isHSM ? '#0A2540' : '#0A7E6E',
      border: `1px solid ${isHSM ? 'rgba(10,37,64,0.15)' : 'rgba(10,126,110,0.15)'}`,
    }}>
      {isHSM ? 'HSM' : 'FSFB'}
    </span>
  );
}
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

/* ══════════════════════════════════════════════════════════════
   ListaInactivos — Personal Inactivo · Hospital Serena del Mar
   Estilo unificado con ListaMedicos
   ══════════════════════════════════════════════════════════════ */

const KPI_THEMES = {
  slate: { title: '#64748b', bar: '#cbd5e1', value: '#334155', ghost: '#0f172a' },
  muted: { title: '#94a3b8', bar: '#e2e8f0', value: '#94a3b8', ghost: '#94a3b8' },
};

function KpiCard({ label, valor, sub, variant = 'slate', icon }) {
  const [hovered, setHovered] = useState(false);
  const t = KPI_THEMES[variant] ?? KPI_THEMES.slate;
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '2rem',
        padding: '1.5rem',
        boxShadow: hovered
          ? '0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10)'
          : '0 4px 20px -5px rgba(0,0,0,0.02)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        height: 192,
        transition: 'all 500ms',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{
          color: t.title, fontWeight: 700, fontSize: '0.625rem',
          textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px',
        }}>
          {label}
        </h3>
        <div style={{ width: 32, height: 4, borderRadius: 9999, background: t.bar, marginBottom: 12 }} />
        {sub && <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>{sub}</p>}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: '2.75rem', lineHeight: 1, fontWeight: 700,
          letterSpacing: '-0.04em', color: t.value,
          fontVariantNumeric: 'tabular-nums', margin: 0,
        }}>
          {valor ?? '—'}
        </p>
      </div>
      {icon && (
        <span className="material-symbols-outlined" style={{
          position: 'absolute', right: '-5%', bottom: '-10%',
          fontSize: 128, lineHeight: 1,
          color: t.ghost, opacity: hovered ? 0.1 : 0.06,
          fontVariationSettings: "'FILL' 0",
          transform: hovered ? 'rotate(0deg) scale(1.05)' : 'rotate(-5deg)',
          pointerEvents: 'none', userSelect: 'none',
          transition: 'all 0.4s ease',
        }}>{icon}</span>
      )}
    </div>
  );
}

export default function ListaInactivos() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [kpis, setKpis]       = useState(null);
  const [kpiLoad, setKpiLoad] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    axiosInstance.get('/dashboard/resumen', { skipToast: true })
      .then(r => setKpis(r.data))
      .catch(() => {})
      .finally(() => setKpiLoad(false));
  }, []);

  const isAdmin = user?.rol === 'admin';

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Personal Inactivo</h2>
          <p>Médicos inactivos · {isAdmin ? 'Posibilidad de reactivación' : 'Vista de solo lectura'}</p>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      {!kpiLoad && kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <KpiCard
            label="Personal Inactivo"
            valor={kpis.totales?.inactivos ?? kpis.inactivos}
            sub="Total sin actividad actual"
            variant="slate"
            icon="person_off"
          />
          <KpiCard
            label="Inactivados este Mes"
            valor={kpis.totales?.inactivos_mes ?? 0}
            sub="Últimos 30 días"
            variant="muted"
            icon="calendar_month"
          />
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{ estado: 'INACTIVO' }}
        titulo="Personal inactivo"
        subtitulo="Médicos sin actividad actual"
        emptyIcon="person_off"
        emptyText="No se encontró personal inactivo"
        statusBadge={(m) => (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <TipoBadge tipo={m.tipo_listado} />
            <EstadoBadge estado={m.estado ?? 'INACTIVO'} />
          </div>
        )}
        showFechaIngreso
        refreshKey={refreshKey}
        SIZE={20}
      />

      <ToastContainer />
    </div>
  );
}
