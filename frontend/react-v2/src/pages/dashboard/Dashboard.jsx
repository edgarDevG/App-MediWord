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

/* ── KPI Themes ───────────────────────────────────────────────── */
const KPI_THEMES = {
  slate:   { title: '#64748b', bar: '#cbd5e1', value: '#334155', ghost: '#0f172a' },
  emerald: { title: '#059669', bar: '#34d399', value: '#059669', ghost: '#10b981' },
  sky:     { title: '#0284c7', bar: '#38bdf8', value: '#0284c7', ghost: '#0ea5e9' },
  muted:   { title: '#94a3b8', bar: '#e2e8f0', value: '#94a3b8', ghost: '#94a3b8' },
  amber:   { title: '#d97706', bar: '#fbbf24', value: '#d97706', ghost: '#f59e0b' },
  indigo:  { title: '#4f46e5', bar: '#818cf8', value: '#4f46e5', ghost: '#6366f1' },
};

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ label, valor, sub, variant = 'slate', icon, children }) {
  const [hovered, setHovered] = useState(false);
  const t = KPI_THEMES[variant] ?? KPI_THEMES.slate;
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
        {children ?? (
          <p style={{
            fontSize: '2rem', lineHeight: 1, fontWeight: 700,
            letterSpacing: '-0.03em', color: t.value,
            fontVariantNumeric: 'tabular-nums', margin: 0,
          }}>
            {valor ?? '—'}
          </p>
        )}
      </div>

      {/* Ghost icon */}
      {icon && (
        <span className="material-symbols-outlined" style={{
          position: 'absolute', right: '-4%', bottom: '-12%',
          fontSize: 72, lineHeight: 1,
          color: t.ghost,
          opacity: hovered ? 0.09 : 0.05,
          fontVariationSettings: "'FILL' 0",
          transform: hovered ? 'rotate(0deg) scale(1.05)' : 'rotate(-5deg)',
          pointerEvents: 'none', userSelect: 'none',
          transition: 'all 0.4s ease',
        }}>{icon}</span>
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
        onClick={() => document.getElementById('btn-notificaciones-panel')?.click()}
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

  const handleChangeStatus = async (nuevoEstado) => {
    setOpen(false);
    if (!window.confirm(`¿Confirmas cambiar el estado del médico a ${nuevoEstado}?`)) return;
    try {
      await axiosInstance.patch(`/medicos/${doc}/estado`, { nuevoEstado });
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
      <button style={menuItemStyle('#92400E')} onClick={() => handleChangeStatus('RENUNCIA')}>
        <span className="material-symbols-outlined sm">assignment_return</span> Marcar Renuncia
      </button>
      <button style={menuItemStyle('#991B1B')} onClick={() => handleChangeStatus('FINALIZADO')}>
        <span className="material-symbols-outlined sm">event_busy</span> Marcar Finalización
      </button>
      <button style={menuItemStyle('#374151')} onClick={() => handleChangeStatus('INACTIVO')}>
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

/* ── Modal cambio de estado ───────────────────────────────────── */
const ACTION_META = {
  renuncia:   { label: 'Marcar renuncia',      color: '#92400E', bg: '#FEF3C7', icon: 'assignment_return', nuevoEstado: 'RENUNCIA'   },
  inactivo:   { label: 'Trasladar a inactivo', color: '#374151', bg: '#F3F4F6', icon: 'person_off',        nuevoEstado: 'INACTIVO'   },
  finalizado: { label: 'Marcar finalización',  color: '#991B1B', bg: '#FEE2E2', icon: 'event_busy',        nuevoEstado: 'FINALIZADO' },
};

function EstadoModal({ accion, doc, nombre, onClose, onSuccess, showToast }) {
  const meta  = ACTION_META[accion] ?? {};
  const today = new Date().toISOString().slice(0, 10);
  const [form,   setForm]   = useState({ fecha: today, autorizacion: false, motivo: '' });
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (accion === 'renuncia'   && !form.fecha) { showToast?.('La fecha de terminación es obligatoria', 'error'); return; }
    if (accion === 'finalizado' && !form.fecha) { showToast?.('La fecha de finalización es obligatoria', 'error'); return; }
    if (accion === 'finalizado' && !form.autorizacion) { showToast?.('Confirma el formulario de autorización de datos', 'error'); return; }

    const payload = { nuevoEstado: meta.nuevoEstado };
    if (form.motivo) payload.motivo = form.motivo;
    if (accion === 'renuncia')   payload.fechaTerminacion          = form.fecha;
    if (accion === 'inactivo')   payload.fechaInactivacion         = form.fecha || today;
    if (accion === 'finalizado') { payload.fechaFinalizacionContrato = form.fecha; payload.formularioAutorizacionDatos = true; }

    setSaving(true);
    try {
      await axiosInstance.patch(`/medicos/${doc}/estado`, payload);
      showToast?.(`${meta.label} registrada correctamente`, 'success');
      onSuccess();
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al actualizar el estado';
      showToast?.(Array.isArray(msg) ? msg.map(m => m.msg ?? String(m)).join(' · ') : msg, 'error');
      setSaving(false);
    }
  };

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,16,62,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, padding: '2rem',
        width: '100%', maxWidth: 460,
        boxShadow: '0 24px 48px rgba(0,16,62,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: meta.color }}>{meta.icon}</span>
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#00103e', margin: 0 }}>{meta.label}</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 0' }}>
              {nombre?.replace(/^Dr[a]?\.?\s+/i, '') ?? doc}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Fecha */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              {accion === 'renuncia' ? 'Fecha de terminación' : accion === 'finalizado' ? 'Fecha de finalización de contrato' : 'Fecha de inactivación'}
              {accion !== 'inactivo' && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
            </label>
            <input type="date" value={form.fecha}
              onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(197,198,210,0.5)', borderRadius: 10, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Autorización de datos — solo finalizado */}
          {accion === 'finalizado' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px', background: '#fef9f9', borderRadius: 10, border: `1px solid ${form.autorizacion ? '#dc2626' : 'rgba(197,198,210,0.4)'}`, transition: 'border-color 150ms' }}>
              <input type="checkbox" checked={form.autorizacion}
                onChange={e => setForm(p => ({ ...p, autorizacion: e.target.checked }))}
                style={{ marginTop: 2, accentColor: '#dc2626', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.4 }}>
                <strong>Formulario de autorización de datos (Ley 1581)</strong> completado y firmado por el médico.
                <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
              </span>
            </label>
          )}

          {/* Motivo */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Motivo <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
            </label>
            <textarea value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
              placeholder="Describe el motivo..."
              rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(197,198,210,0.5)', borderRadius: 10, fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving}
            style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid rgba(197,198,210,0.5)', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={saving}
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: meta.color, color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
            {saving && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>}
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Dashboard principal ──────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [resumen,     setResumen]     = useState(null);
  const [loadKpi,     setLoadKpi]     = useState(true);
  const [refreshKey,  setRefreshKey]  = useState(0);

  /* ── KPIs ─────────────────────────────────────────────────── */
  useEffect(() => {
    setLoadKpi(true);
    axiosInstance.get('/dashboard/resumen/', { skipToast: true })
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
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '1.5rem', marginBottom: '2rem',
      }}>
        {loadKpi
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 192, borderRadius: '2rem' }} />
            ))
          : (<>
              <KpiCard
                label="Total Médicos"
                valor={tot.hsm_total ?? tot.total_medicos}
                variant="slate" icon="groups"
                sub="Cuerpo médico global"
              />
              <KpiCard
                label="Médicos Activos"
                valor={tot.hsm_activos ?? tot.activos}
                variant="emerald" icon="verified_user"
                sub="Planta operativa"
              />
              <KpiCard
                label="En Proceso"
                valor={tot.en_proceso}
                variant="sky" icon="schedule"
                sub="Vinculación"
              />
              <KpiCard
                label="Inactivos"
                valor={tot.inactivos}
                variant="muted" icon="cancel"
                sub="Histórico bajas"
              />
              <KpiCard
                label="Alertas Venc."
                valor={alertas || '—'}
                variant="amber" icon="warning"
                sub="Docs requeridos"
              />
              <KpiCard label="Por Categoría" variant="indigo" icon="layers">
                {cats.length > 0
                  ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {cats.map((c, i) => {
                        const col = CAT_COLORS[c.categoria] ?? { bg: '#e0e7ff', color: '#4f46e5' };
                        return (
                          <span key={i} style={{
                            fontSize: '0.625rem', fontWeight: 700,
                            background: col.bg + '80', color: col.color,
                            padding: '1px 10px', borderRadius: 9999,
                            border: `1px solid ${col.bg}80`,
                          }}>
                            {c.categoria}: {c.total}
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
        apiParams={{ tipo_listado: 'cuerpo_medico', estado: 'ACTIVO' }}
        titulo="Listado del cuerpo médico"
        subtitulo="Planta HSM · Vista integrada"
        emptyIcon="person_search"
        emptyText="No se encontraron médicos"
        showCatFilter
        catList={[...cats].sort((a, b) => b.total - a.total).slice(0, 4).map(c => c.categoria)}
        refreshKey={refreshKey}
      />

      <ToastContainer />
    </div>
  );
}
