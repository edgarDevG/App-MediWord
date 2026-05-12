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

/* ══════════════════════════════════════════════════════════════
   ListaRenuncias — Historial de Renuncias · Hospital Serena del Mar
   Estilo unificado con ListaMedicos
   ══════════════════════════════════════════════════════════════ */

const KPI_THEMES = {
  rose:  { title: '#e11d48', bar: '#fb7185', value: '#be123c', ghost: '#f43f5e' },
  slate: { title: '#64748b', bar: '#cbd5e1', value: '#334155', ghost: '#0f172a' },
};

function KpiCard({ label, valor, sub, variant = 'rose', icon }) {
  const [hovered, setHovered] = useState(false);
  const t = KPI_THEMES[variant] ?? KPI_THEMES.rose;
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(226,232,240,0.8)',
        borderRadius: '1.25rem',
        padding: '1rem 1.25rem',
        boxShadow: hovered
          ? '0 8px 20px rgba(0,0,0,0.08)'
          : '0 2px 8px rgba(0,16,62,0.04)',
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'all 300ms',
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
          fontSize: '2rem', lineHeight: 1, fontWeight: 700,
          letterSpacing: '-0.03em', color: t.value,
          fontVariantNumeric: 'tabular-nums', margin: 0,
        }}>
          {valor ?? '—'}
        </p>
      </div>
      {icon && (
        <span className="material-symbols-outlined" style={{
          position: 'absolute', right: '-4%', bottom: '-12%',
          fontSize: 72, lineHeight: 1,
          color: t.ghost, opacity: hovered ? 0.09 : 0.05,
          fontVariationSettings: "'FILL' 0",
          transform: hovered ? 'rotate(0deg) scale(1.05)' : 'rotate(-5deg)',
          pointerEvents: 'none', userSelect: 'none',
          transition: 'all 0.4s ease',
        }}>{icon}</span>
      )}
    </div>
  );
}

export default function ListaRenuncias() {
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
          <h2>Renuncias</h2>
          <p>Historial de médicos con renuncia registrada</p>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      {!kpiLoad && kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <KpiCard
            label="Renuncias Registradas"
            valor={kpis.totales?.renuncias ?? kpis.renuncias ?? 0}
            sub="Historial total de bajas"
            variant="rose"
            icon="person_remove"
          />
          <KpiCard
            label="Renuncias este Mes"
            valor={kpis.totales?.renuncias_mes ?? 0}
            sub="Últimos 30 días"
            variant="slate"
            icon="calendar_month"
          />
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{ estado: 'RENUNCIA' }}
        titulo="Médicos con renuncia"
        subtitulo="Registros históricos"
        emptyIcon="assignment_return"
        emptyText="No se encontraron renuncias"
        statusBadge={(m) => (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <TipoBadge tipo={m.tipo_listado} />
            <EstadoBadge estado={m.estado ?? 'RENUNCIA'} />
          </div>
        )}
        showFechaIngreso
        SIZE={20}
      />
    </div>
  );
}
