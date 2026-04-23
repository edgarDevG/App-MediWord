import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import MedicoTable, { EstadoBadge } from '../../components/shared/MedicoTable';

/* ══════════════════════════════════════════════════════════════
   ListaFinalizaciones — Contratos finalizados · Hospital Serena del Mar
   Estilo unificado con ListaMedicos
   ══════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, variant, icon, meta }) {
  const themes = {
    purple:  { bg: 'rgba(124,58,237,0.07)',  accent: '#7c3aed', val: '#5b21b6' },
    neutral: { bg: 'rgba(71,85,105,0.07)',   accent: '#475569', val: '#334155' },
    warning: { bg: 'rgba(180,83,9,0.08)',    accent: '#b45309', val: '#92400e' },
  };
  const t = themes[variant] ?? themes.purple;
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

export default function ListaFinalizaciones() {
  const [kpis, setKpis]       = useState(null);
  const [kpiLoad, setKpiLoad] = useState(true);

  useEffect(() => {
    axiosInstance.get('/dashboard/resumen', { skipToast: true })
      .then(r => setKpis(r.data))
      .catch(() => {})
      .finally(() => setKpiLoad(false));
  }, []);

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Finalizaciones</h2>
          <p>Contratos finalizados · Registros de solo lectura</p>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      {!kpiLoad && kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <KpiCard label="Finalizaciones"    value={kpis.totales?.finalizados ?? 0} variant="purple"  icon="event_busy" />
          <KpiCard label="Personal inactivo" value={kpis.totales?.inactivos ?? kpis.inactivos} variant="neutral" icon="person_off" />
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{ estado: 'FINALIZADO' }}
        titulo="Contratos finalizados"
        subtitulo="Médicos con contrato terminado"
        emptyIcon="event_busy"
        emptyText="No se encontraron finalizaciones"
        statusBadge={(m) => <EstadoBadge estado={m.estado ?? 'FINALIZADO'} />}
        showFechaIngreso
        SIZE={20}
      />
    </div>
  );
}
