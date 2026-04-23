import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import MedicoTable, { EstadoBadge } from '../../components/shared/MedicoTable';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

/* ══════════════════════════════════════════════════════════════
   ListaInactivos — Personal Inactivo · Hospital Serena del Mar
   Estilo unificado con ListaMedicos
   ══════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, variant, icon, meta }) {
  const themes = {
    neutral: { bg: 'rgba(71,85,105,0.07)',  accent: '#475569', val: '#334155' },
    primary: { bg: 'rgba(26,78,215,0.07)',  accent: '#1a4ed7', val: '#00103e' },
    warning: { bg: 'rgba(180,83,9,0.08)',   accent: '#b45309', val: '#92400e' },
  };
  const t = themes[variant] ?? themes.neutral;
  return (
    <div style={{
      background: t.bg, borderRadius: 14, padding: '18px 20px',
      border: `1px solid ${t.accent}20`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        {icon && <span className="material-symbols-outlined" style={{ fontSize: 18, color: t.accent, opacity: 0.7 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: t.val, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
        {value ?? '—'}
      </p>
      {meta && <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>{meta}</p>}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <KpiCard label="Personal inactivo"  value={kpis.totales?.inactivos ?? kpis.inactivos} variant="neutral" icon="person_off" />
          <KpiCard label="Renuncias"          value={kpis.totales?.renuncias ?? kpis.renuncias ?? 0} variant="warning" icon="assignment_return" />
          <KpiCard label="Médicos activos"    value={kpis.totales?.activos ?? kpis.activos}     variant="primary" icon="verified_user" meta="Referencia planta activa" />
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{ estado: 'INACTIVO' }}
        titulo="Personal inactivo"
        subtitulo="Médicos sin actividad actual"
        emptyIcon="person_off"
        emptyText="No se encontró personal inactivo"
        statusBadge={(m) => <EstadoBadge estado={m.estado ?? 'INACTIVO'} />}
        showFechaIngreso
        refreshKey={refreshKey}
        SIZE={20}
      />

      <ToastContainer />
    </div>
  );
}
