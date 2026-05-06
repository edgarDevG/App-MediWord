import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import MedicoTable from '../../components/shared/MedicoTable';

/* ══════════════════════════════════════════════════════════════
   ListaFSFB — Médicos FSFB · Hospital Serena del Mar
   Estilo unificado con ListaMedicos (avatares + KPI strip)
   ══════════════════════════════════════════════════════════════ */

const KPI_THEMES = {
  slate:   { title: '#64748b', bar: '#cbd5e1', value: '#334155', ghost: '#0f172a' },
  emerald: { title: '#059669', bar: '#34d399', value: '#059669', ghost: '#10b981' },
  amber:   { title: '#d97706', bar: '#fbbf24', value: '#d97706', ghost: '#f59e0b' },
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
      {/* Sección superior */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{
          color: t.title, fontWeight: 700, fontSize: '0.625rem',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          margin: '0 0 6px',
        }}>
          {label}
        </h3>
        <div style={{ width: 32, height: 4, borderRadius: 9999, background: t.bar, marginBottom: 12 }} />
        {sub && (
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>
            {sub}
          </p>
        )}
      </div>

      {/* Sección inferior */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: '2.75rem', lineHeight: 1, fontWeight: 700,
          letterSpacing: '-0.04em', color: t.value,
          fontVariantNumeric: 'tabular-nums', margin: 0,
        }}>
          {valor ?? '—'}
        </p>
      </div>

      {/* Ghost icon */}
      {icon && (
        <span className="material-symbols-outlined" style={{
          position: 'absolute', right: '-5%', bottom: '-10%',
          fontSize: 128, lineHeight: 1,
          color: t.ghost,
          opacity: hovered ? 0.1 : 0.06,
          fontVariationSettings: "'FILL' 0",
          transform: hovered ? 'rotate(0deg) scale(1.05)' : 'rotate(-5deg)',
          pointerEvents: 'none', userSelect: 'none',
          transition: 'all 0.4s ease',
        }}>{icon}</span>
      )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <KpiCard label="Médicos FSFB"  valor={kpis.totales?.fsfb_total}          variant="slate"   icon="business"      sub="Personal externo FSFB" />
          <KpiCard label="Activos"       valor={kpis.totales?.fsfb_activos}        variant="emerald" icon="verified_user" sub="Planta operativa" />
          <KpiCard label="Alertas venc." valor={kpis.totales?.alertas_vencimiento} variant="amber"   icon="warning"      sub="Docs requeridos" />
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{ tipo_listado: 'fsfb_externo', estado: 'ACTIVO' }}
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
