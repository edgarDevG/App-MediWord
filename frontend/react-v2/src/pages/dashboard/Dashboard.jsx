/* ══════════════════════════════════════════════════════════════
   Dashboard.jsx v6 — MediWork HSM
   Diseño refinado — lógica de fetching intacta
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import MedicoTable from '../../components/shared/MedicoTable';

const CAT_COLORS = {
  A:  { bg: '#dce1ff', color: '#003ab3' },
  AE: { bg: '#f3e8ff', color: '#6b21a8' },
  AP: { bg: '#ccfbf1', color: '#004f58' },
  C:  { bg: '#fef9c3', color: '#854d0e' },
  B:  { bg: '#fce7f3', color: '#9d174d' },
  E:  { bg: '#fce7f3', color: '#9d174d' },
};

const safe = (v) => (v === undefined || v === null || v === '') ? '—' : v;

const stripEsp = (v) => v ? v.replace(/^especialista en /i, '') : v;

const mapMedico = (m) => ({
  doc:   safe(m.documento_identidad),
  nom:   safe(m.nombre_medico),
  cat:   safe(m.categoria),
  esp:   safe(stripEsp(m.especialidad)),
  sec:   safe(m.seccion_nombre),
  dep:   safe(m.dept_coordinacion_nombre),
  cargo: safe(m.cargo ?? m.funcion),
  est:   m.estado ?? 'ACTIVO',
});

/* ── Componentes UI ───────────────────────────────────────────── */
function BadgeCat({ cat }) {
  const s = CAT_COLORS[cat] ?? { bg: '#e2e8f0', color: '#475569' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: 9999,
      fontSize: '0.6875rem', fontWeight: 700, whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      {cat !== '—' ? `Cat ${cat}` : '—'}
    </span>
  );
}

function BadgeEstado({ estado }) {
  const e = (estado ?? '').toString().toUpperCase();
  const cfg = e.includes('INACTIV') || e.includes('VENC') || e.includes('ALERTA')
    ? { icon: 'warning',      color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  label: 'Alerta doc.' }
    : e.includes('PROCESO')   || e.includes('TRAMITE')
    ? { icon: 'pending',      color: '#d97706', bg: 'rgba(245,158,11,0.08)', label: 'En proceso'  }
    : { icon: 'check_circle', color: '#065f46', bg: 'rgba(6,95,70,0.07)',    label: 'Activo'      };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.8125rem', fontWeight: 600, color: cfg.color,
      background: cfg.bg, padding: '3px 10px', borderRadius: 9999,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ label, valor, sub, accentColor, icon, children, alert }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 14,
        padding: '22px 20px 22px 24px',
        boxShadow: '0 1px 4px rgba(25,28,30,0.07), 0 0 0 1px rgba(197,198,210,0.20)',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 150ms, transform 150ms',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(25,28,30,0.11)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(25,28,30,0.07), 0 0 0 1px rgba(197,198,210,0.20)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* barra vertical izquierda */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
        background: accentColor,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* icono */}
      {icon && (
        <div style={{
          position: 'absolute', right: 18, top: 18,
          width: 44, height: 44, borderRadius: 12,
          background: `radial-gradient(circle at 60% 40%, ${accentColor}22 0%, ${accentColor}0d 100%)`,
          border: `1px solid ${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentColor,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
        </div>
      )}

      <p style={{
        fontSize: '0.6875rem', fontWeight: 700, color: '#8694aa',
        textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1,
        paddingRight: 56,
      }}>
        {label}
      </p>

      {children ?? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: '2.625rem', fontWeight: 800, lineHeight: 1,
              color: alert ? '#dc2626' : '#00103e',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {safe(valor)}
            </span>
          </div>
          {sub && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginTop: -2 }}>
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Alert Banner ─────────────────────────────────────────────── */
function AlertBanner({ count }) {
  if (!count || count === 0 || count === '—') return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff1f1 0%, #fff7f7 100%)',
      border: '1px solid #fecaca',
      borderLeft: '4px solid #ef4444',
      borderRadius: 12,
      padding: '13px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      marginBottom: 22,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: '#fee2e2', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#dc2626',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>warning</span>
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991b1b' }}>
          {count} {count === 1 ? 'médico' : 'médicos'} con documentos por vencer
        </p>
        <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
          Revisa el panel de alertas para ver el detalle de cada documento
        </span>
      </div>
      <button
        style={{
          marginLeft: 'auto', padding: '7px 14px',
          borderRadius: 8, border: 'none',
          background: '#fee2e2', color: '#dc2626',
          fontSize: '0.75rem', fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'background 120ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
        onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
      >
        Ver alertas →
      </button>
    </div>
  );
}

/* ── ActionMenu de Tabla ───────────────────────────────────── */
function ActionMenu({ doc, onReload, showToast }) {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [open, setOpen]     = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close    = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  const handleChangeStatus = async (nuevoEstado, tipoListado) => {
    setOpen(false);
    if (!window.confirm(`¿Confirmas cambiar el estado del médico a ${nuevoEstado}?`)) return;
    try {
      await axiosInstance.patch(`/medicos/${doc}/estado`, { estado: nuevoEstado, tipo_listado: tipoListado });
      showToast?.('Estado actualizado correctamente', 'success');
      onReload?.();
    } catch (e) {
      showToast?.(e.response?.data?.detail ?? 'Error al actualizar el estado', 'error');
    }
  };

  const dropdown = open && createPortal(
    <div ref={menuRef} style={{
      position: 'fixed', top: menuPos.top, right: menuPos.right,
      background: 'white', borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(197,198,210,0.3)',
      minWidth: 210, zIndex: 9999,
      display: 'flex', flexDirection: 'column', padding: '4px 0',
    }}>
      <Link to={`/medicos/${doc}/perfil`} style={{ ...menuItemStyle(false), textDecoration: 'none' }} onClick={() => setOpen(false)}>
        <span className="material-symbols-outlined sm">person</span> Ver perfil médico
      </Link>
      <Link to={`/medicos/${doc}/editar`} style={{ ...menuItemStyle(false), textDecoration: 'none' }} onClick={() => setOpen(false)}>
        <span className="material-symbols-outlined sm">edit</span> Editar carpetas
      </Link>
      <div style={{ height: 1, background: 'rgba(197,198,210,0.25)', margin: '3px 0' }} />
      <button style={menuItemStyle('#92400E')} onClick={() => handleChangeStatus('RENUNCIA', 'renuncia')}>
        <span className="material-symbols-outlined sm">assignment_return</span> Marcar Renuncia
      </button>
      <button style={menuItemStyle('#991B1B')} onClick={() => handleChangeStatus('FINALIZADO', 'finalizacion')}>
        <span className="material-symbols-outlined sm">event_busy</span> Marcar Finalización
      </button>
      <button style={menuItemStyle('#374151')} onClick={() => handleChangeStatus('INACTIVO', 'inactivo')}>
        <span className="material-symbols-outlined sm">person_off</span> Trasladar a Inactivo
      </button>
    </div>,
    document.body
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
      <button
        title="Ver perfil"
        onClick={() => navigate(`/medicos/${doc}/perfil`)}
        style={iconBtnStyle}
        onMouseEnter={e => { e.currentTarget.style.color = '#00103e'; e.currentTarget.style.background = '#f2f4f6'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
      >
        <span className="material-symbols-outlined sm">open_in_new</span>
      </button>
      {user?.rol === 'admin' && (
        <>
          <button ref={btnRef} title="Acciones" onClick={handleOpen}
            style={{ ...iconBtnStyle, background: open ? '#f2f4f6' : 'transparent', color: open ? '#00103e' : '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00103e'; e.currentTarget.style.background = '#f2f4f6'; }}
            onMouseLeave={e => { if (!open) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; } }}
          >
            <span className="material-symbols-outlined sm">more_vert</span>
          </button>
          {dropdown}
        </>
      )}
    </div>
  );
}

const iconBtnStyle = {
  width: 30, height: 30, borderRadius: 7, border: 'none',
  cursor: 'pointer', background: 'transparent', color: '#94a3b8',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 120ms, background 120ms',
};

const menuItemStyle = (color) => ({
  textAlign: 'left', padding: '9px 14px', border: 'none',
  background: 'transparent', cursor: 'pointer',
  fontSize: '0.8125rem', fontWeight: 600,
  color: color || '#334155',
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
});

/* ── Dashboard principal ──────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [resumen,   setResumen]   = useState(null);
  const [loadKpi,   setLoadKpi]   = useState(true);

  /* ── KPIs ─────────────────────────────────────────────────── */
  useEffect(() => {
    setLoadKpi(true);
    axiosInstance.get('/dashboard/resumen', { skipToast: true })
      .then(r => setResumen(r.data))
      .catch(() => {})
      .finally(() => setLoadKpi(false));
  }, []);

  /* ── Extraer KPIs ─────────────────────────────────────────── */
  const tot     = resumen?.totales ?? {};
  const cats    = resumen?.por_categoria ?? [];
  const alertas = Number(tot.alertas ?? tot.alertas_vencimiento ?? 0);

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Cuerpo Médico</h2>
          <p>Dirección Médica · Vista integrada · Hospital Serena del Mar</p>
        </div>
        <button
          className="btn btn-signature"
          onClick={() => navigate('/medicos/nuevo')}
        >
          <span className="material-symbols-outlined sm">person_add</span>
          Nuevo médico
        </button>
      </div>

      {/* Alert Banner — solo visible si hay alertas */}
      {!loadKpi && <AlertBanner count={alertas} />}

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 26,
      }}>
        {loadKpi
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />
            ))
          : (<>
              <KpiCard
                label="Total Médicos" valor={tot.total_medicos}
                accentColor="#00103e" topColor="#00103e"
                icon="groups" sub="Cuerpo médico"
              />
              <KpiCard
                label="Médicos Activos" valor={tot.activos}
                accentColor="#1a4ed7" topColor="#1a4ed7"
                icon="verified_user" sub="Planta activa"
              />
              <KpiCard
                label="En Proceso" valor={tot.en_proceso}
                accentColor="#d97706" topColor="#f59e0b"
                icon="pending"
              />
              <KpiCard
                label="Personal Inactivo" valor={tot.inactivos}
                accentColor="#94a3b8" topColor="#94a3b8"
                icon="person_off"
              />
              <KpiCard
                label="Alertas Venc." valor={alertas || '—'}
                accentColor="#dc2626" topColor="#ef4444"
                icon={alertas > 0 ? 'priority_high' : 'check_circle'}
                alert={alertas > 0}
              />
              {/* Por Categoría */}
              <KpiCard label="Por Categoría" accentColor="#0e7e6e" topColor="#0e7e6e" icon="category">
                {cats.length > 0
                  ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                      {cats.map((c, i) => {
                        const col = CAT_COLORS[c.categoria] ?? { bg: '#e2e8f0', color: '#475569' };
                        return (
                          <span key={i} style={{
                            fontSize: '0.625rem', fontWeight: 700,
                            background: col.bg, color: col.color,
                            padding: '3px 8px', borderRadius: 6,
                          }}>
                            {c.categoria} · {c.total}
                          </span>
                        );
                      })}
                    </div>
                  )
                  : <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>—</span>
                }
              </KpiCard>
            </>)
        }
      </div>

      {/* Tabla — componente compartido con avatares y estilos premium */}
      <MedicoTable
        apiParams={{}}
        titulo="Listado del cuerpo médico"
        subtitulo="Planta HSM · Vista integrada"
        emptyIcon="person_search"
        emptyText="No se encontraron médicos"
        showCatFilter
        SIZE={20}
      />
      <ToastContainer />
    </div>
  );
}
