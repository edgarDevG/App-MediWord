import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import MedicoTable from '../../components/shared/MedicoTable';

/* ══════════════════════════════════════════════════════════════
   ListaFSFB — Médicos FSFB · Hospital Serena del Mar
   Estilo unificado con ListaMedicos (avatares + KPI strip)
   ══════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, variant, icon }) {
  const themes = {
    teal:    { bg: 'rgba(10,126,110,0.07)', accent: '#0A7E6E', val: '#00103e' },
    primary: { bg: 'rgba(26,78,215,0.07)',  accent: '#1a4ed7', val: '#00103e' },
    warning: { bg: 'rgba(180,83,9,0.08)',   accent: '#b45309', val: '#92400e' },
    neutral: { bg: 'rgba(71,85,105,0.07)',  accent: '#475569', val: '#334155' },
  };
  const t = themes[variant] ?? themes.teal;
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
    </div>
  );
}

export default function ListaFSFB() {
  const navigate = useNavigate();
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
          <h2>Médicos FSFB</h2>
          <p>Médicos externos vinculados a FSFB · Estructura simplificada</p>
        </div>
        <button className="btn btn-signature" onClick={() => navigate('/medicos-fsfb/nuevo')}>
          <span className="material-symbols-outlined sm">person_add</span>
          Nuevo médico FSFB
        </button>
      </div>

      {/* ── KPI Strip ── */}
      {!kpiLoad && kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <KpiCard label="Médicos FSFB"   value={kpis.totales?.fsfb ?? kpis.fsfb}       variant="teal"    icon="business" />
          <KpiCard label="Activos"        value={kpis.totales?.activos ?? kpis.activos}  variant="primary" icon="verified_user" />
          <KpiCard label="Alertas venc."  value={kpis.totales?.alertas ?? kpis.alertas}  variant="warning" icon="priority_high" />
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{ tipo_listado: 'fsfb_externo' }}
        titulo="Listado médicos FSFB"
        subtitulo="Personal externo Fundación Santa Fe"
        emptyIcon="business"
        emptyText="No se encontraron médicos FSFB"
        showCatFilter
        editRoute={(doc) => `/medicos-fsfb/${doc}/editar`}
        SIZE={20}
      />
    </div>
  );
}
