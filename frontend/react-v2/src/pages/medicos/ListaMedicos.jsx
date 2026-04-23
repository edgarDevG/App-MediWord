import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import MedicoTable from '../../components/shared/MedicoTable';
import CambioEstadoModal from '../../components/shared/CambioEstadoModal';
import { useToast } from '../../components/Toast';

/* ══════════════════════════════════════════════════════════════
   ListaMedicos — Cuerpo Médico · Hospital Serena del Mar
   ══════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, variant, meta, icon }) {
  const themes = {
    primary: { bg: 'rgba(26,78,215,0.07)',  accent: '#1a4ed7', val: '#00103e' },
    teal:    { bg: 'rgba(10,126,110,0.07)', accent: '#0A7E6E', val: '#00103e' },
    error:   { bg: 'rgba(186,26,26,0.07)',  accent: '#ba1a1a', val: '#ba1a1a' },
    warning: { bg: 'rgba(180,83,9,0.08)',   accent: '#b45309', val: '#92400e' },
    neutral: { bg: 'rgba(71,85,105,0.07)',  accent: '#475569', val: '#334155' },
    dark:    { bg: 'rgba(0,16,62,0.06)',    accent: '#00103e', val: '#00103e' },
  };
  const t = themes[variant] ?? themes.primary;
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

function AlertStrip({ count, onOpenDrawer }) {
  if (!count) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
      background: 'rgba(186,26,26,0.06)',
      border: '1px solid rgba(186,26,26,0.18)',
      borderRadius: 14, padding: '14px 20px', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(186,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#ba1a1a' }}>warning</span>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7f1d1d' }}>
            Alertas críticas de documentación
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#991b1b', marginTop: 2 }}>
            <strong>{count}</strong> especialistas con documentos que vencen en los próximos 15 días
          </p>
        </div>
      </div>
      <button className="btn btn-tonal" onClick={onOpenDrawer} style={{ flexShrink: 0 }}>
        <span className="material-symbols-outlined sm">open_in_new</span>
        Ver detalles
      </button>
    </div>
  );
}


export default function ListaMedicos() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [kpis,       setKpis]       = useState(null);
  const [kpiLoad,    setKpiLoad]    = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false); // eslint-disable-line no-unused-vars
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState({ open: false, accion: null, doc: null, nombre: null });

  useEffect(() => {
    axiosInstance.get('/dashboard/resumen', { skipToast: true })
      .then(r => setKpis(r.data))
      .catch(() => {})
      .finally(() => setKpiLoad(false));
  }, []);

  const handleEstadoAction = (accion, doc, nombre) => {
    setModal({ open: true, accion, doc, nombre });
  };

  const handleModalSuccess = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Cuerpo Médico</h2>
          <p>Dirección Médica · Vista integrada · Hospital Serena del Mar</p>
        </div>
        <button className="btn btn-signature" onClick={() => navigate('/medicos/nuevo')}>
          <span className="material-symbols-outlined sm">person_add</span>
          Nuevo médico
        </button>
      </div>

      {/* ── Alert strip ── */}
      <AlertStrip count={kpis?.alertas} onOpenDrawer={() => setDrawerOpen(true)} />

      {/* ── KPI Grid ── */}
      {!kpiLoad && kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <KpiCard label="Médicos activos"     value={kpis.totales?.activos ?? kpis.activos}   variant="primary" meta="Cuerpo médico planta" />
          <KpiCard label="Médicos FSFB"        value={kpis.totales?.fsfb ?? kpis.fsfb}          variant="teal"    meta="Planta Fundación" />
          <KpiCard label="Alertas vencimiento" value={kpis.totales?.alertas ?? kpis.alertas}    variant="error"   icon="priority_high" />
          <KpiCard label="Personal inactivo"   value={kpis.totales?.inactivos ?? kpis.inactivos} variant="neutral" />
          <KpiCard label="Renuncias mes"       value={kpis.totales?.renuncias ?? kpis.renuncias ?? 0} variant="warning" />
          <div style={{ background:'rgba(0,16,62,0.05)', borderRadius:14, padding:'18px 20px', border:'1px solid rgba(0,16,62,0.1)' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Por categoría</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {[['A',kpis.cat_a ?? kpis.totales?.cat_a], ['AE',kpis.cat_ae ?? kpis.totales?.cat_ae], ['AP',kpis.cat_ap ?? kpis.totales?.cat_ap]].filter(([,v]) => v != null).map(([cat, val]) => (
                <span key={cat} className={`badge badge-cat-${cat.toLowerCase()}`}>
                  {cat}: {val}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <MedicoTable
        apiParams={{}}
        titulo="Listado del cuerpo médico"
        subtitulo="Planta HSM · Vista integrada"
        emptyIcon="manage_search"
        emptyText="No se encontraron médicos"
        showCatFilter
        SIZE={25}
        refreshKey={refreshKey}
        onEstadoAction={handleEstadoAction}
      />

      {/* ── Modal cambio de estado ── */}
      {modal.open && (
        <CambioEstadoModal
          accion={modal.accion}
          doc={modal.doc}
          nombre={modal.nombre}
          onClose={() => setModal(m => ({ ...m, open: false }))}
          onSuccess={handleModalSuccess}
          showToast={showToast}
        />
      )}

      {/* ── Toasts ── */}
      <ToastContainer />
    </div>
  );
}
