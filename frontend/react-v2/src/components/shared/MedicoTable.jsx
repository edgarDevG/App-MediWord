/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import DoctorAvatar, { CAT_COLORS, getAvatarColor } from './DoctorAvatar';
import CredentialModal from './CredentialModal';

/* ══════════════════════════════════════════════════════════════
   MedicoTable — Componente premium compartido · MediWork HSM v2
   ══════════════════════════════════════════════════════════════ */

// Re-exportamos para compatibilidad con PerfilMedico.jsx
export { CAT_COLORS };
export const catColor = (cat) => {
  const c = getAvatarColor(cat, '');
  return { bg: c.bg.replace('0.15', '0.10'), color: c.color, avBg: c.bg, label: cat || '—' };
};
export function initials(name) {
  if (!name) return '?';
  const clean = name.replace(/^Dr[a]?\.?\s+/i, '').trim();
  return clean.split(/\s+/).slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase() || '?';
}
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
const safe = (v) => (v == null || v === '') ? '—' : String(v);

/* ── Badge universal de estado ────────────────────────────── */
const ESTADO_BADGE = {
  ACTIVO:     { color: '#166534', bg: '#DCFCE7', icon: 'check_circle',  label: 'Activo'     },
  INACTIVO:   { color: '#374151', bg: '#F3F4F6', icon: 'person_off',    label: 'Inactivo'   },
  RENUNCIA:   { color: '#92400E', bg: '#FEF3C7', icon: 'logout',        label: 'Renuncia'   },
  FINALIZADO: { color: '#991B1B', bg: '#FEE2E2', icon: 'event_busy',    label: 'Finalizado' },
  EN_PROCESO: { color: '#1D4ED8', bg: '#DBEAFE', icon: 'hourglass_top', label: 'En proceso' },
};

export function EstadoBadge({ estado }) {
  const s = ESTADO_BADGE[estado] ?? ESTADO_BADGE.ACTIVO;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.75rem', fontWeight: 600,
      color: s.color, background: s.bg,
      padding: '3px 10px', borderRadius: 9999,
      whiteSpace: 'nowrap',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
      {s.label}
    </span>
  );
}

/* ── Configuración de acciones de estado ─────────────────── */
const ACCION_CFG = {
  renuncia:   { title: 'Marcar Renuncia',        icon: 'assignment_return', color: '#92400E', bg: '#FEF3C7', nuevoEstado: 'RENUNCIA',   fechaLabel: 'Fecha de terminación',              fechaRequired: true,  showAuth: false },
  inactivo:   { title: 'Trasladar a Inactivo',   icon: 'person_off',        color: '#374151', bg: '#F3F4F6', nuevoEstado: 'INACTIVO',   fechaLabel: 'Fecha de inactivación',             fechaRequired: false, showAuth: false },
  finalizado: { title: 'Marcar Finalización',    icon: 'event_busy',        color: '#991B1B', bg: '#FEE2E2', nuevoEstado: 'FINALIZADO', fechaLabel: 'Fecha de finalización de contrato', fechaRequired: true,  showAuth: true  },
  reactivar:  { title: 'Reactivar Médico',       icon: 'person_check',      color: '#065f46', bg: '#d1fae5', nuevoEstado: 'ACTIVO',     fechaLabel: 'Nueva fecha de ingreso',            fechaRequired: false, showAuth: false },
  reingreso:  { title: 'Registrar Reingreso',    icon: 'person_add',        color: '#065f46', bg: '#d1fae5', nuevoEstado: 'ACTIVO',     fechaLabel: 'Nueva fecha de ingreso',            fechaRequired: true,  showAuth: false },
  eliminar:   { title: 'Eliminar Registro',      icon: 'delete_forever',    color: '#7f1d1d', bg: '#fef2f2', isDeletion: true },
};

/* ── Modal de gestión de estado ──────────────────────────── */
function GestionModal({ accion, doc, nombre, estadoActual, onClose, onDone }) {
  const cfg    = ACCION_CFG[accion] ?? {};
  const today  = new Date().toISOString().slice(0, 10);
  const [fecha,    setFecha]    = useState(today);
  const [autori,   setAutori]   = useState(false);
  const [motivo,   setMotivo]   = useState('');
  const [showCredModal, setShowCredModal] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const nombreCorto = (nombre ?? doc).replace(/^Dr[a]?\.?\s+/i, '').split(' ').slice(0, 3).join(' ');

  // Eliminar: ejecutar después de validación de credenciales
  const executeDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(`/medicos/${doc}`);
      onDone();
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al eliminar el registro.');
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (cfg.isDeletion) {
      // Abrir modal de credenciales en lugar de pedir nombre
      setShowCredModal(true);
      return;
    }

    if (cfg.fechaRequired && !fecha) { setError('La fecha es obligatoria.'); return; }
    if (cfg.showAuth && !autori) { setError('Debes confirmar el formulario de autorización de datos.'); return; }

    const payload = { nuevoEstado: cfg.nuevoEstado, motivo: motivo || undefined };
    if (accion === 'renuncia')                              payload.fechaTerminacion = fecha;
    if (accion === 'inactivo')                              payload.fechaInactivacion = fecha || today;
    if (accion === 'finalizado') { payload.fechaFinalizacionContrato = fecha; payload.formularioAutorizacionDatos = true; }
    if (accion === 'reactivar' || accion === 'reingreso')  { if (fecha) payload.fechaIngreso = fecha; }

    setSaving(true);
    try {
      await axiosInstance.patch(`/medicos/${doc}/estado`, payload);
      onDone();
    } catch (e) {
      const msg = e.response?.data?.detail;
      setError(Array.isArray(msg) ? msg.map(m => m.msg ?? String(m)).join(' · ') : (msg ?? 'Error al actualizar el estado.'));
      setSaving(false);
    }
  };

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,16,62,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 24px 48px rgba(0,16,62,0.18)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: cfg.color }}>{cfg.icon}</span>
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#00103e', margin: 0 }}>{cfg.title}</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 0' }}>{nombreCorto}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Aviso eliminación */}
          {cfg.isDeletion && (
            <div style={{ padding: '12px 14px', background: 'rgba(127,29,29,0.06)', border: '1px solid rgba(127,29,29,0.2)', borderRadius: 10, fontSize: '0.8125rem', color: '#7f1d1d', lineHeight: 1.5 }}>
              <strong>Esta acción es irreversible.</strong> Se eliminarán todos los datos del médico (historial, documentos, contratos, normativos).
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#991b1b' }}>
                Se requerirá autorización con credenciales de Administrador o Supervisor.
              </p>
            </div>
          )}

          {/* Fecha */}
          {!cfg.isDeletion && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                {cfg.fechaLabel}
                {cfg.fechaRequired && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
                {!cfg.fechaRequired && <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 4, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>}
              </label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(197,198,210,0.5)', borderRadius: 10, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* Autorización datos (solo finalizado) */}
          {cfg.showAuth && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px', background: '#fef9f9', borderRadius: 10, border: `1px solid ${autori ? '#dc2626' : 'rgba(197,198,210,0.4)'}` }}>
              <input type="checkbox" checked={autori} onChange={e => setAutori(e.target.checked)} style={{ marginTop: 2, accentColor: '#dc2626', width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.4 }}>
                <strong>Formulario de autorización de datos (Ley 1581)</strong> completado y firmado.
                <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
              </span>
            </label>
          )}

          {/* Motivo */}
          {!cfg.isDeletion && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Motivo <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
              </label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2}
                placeholder="Describe el motivo..."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(197,198,210,0.5)', borderRadius: 10, fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize: '0.8125rem', color: '#dc2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '8px 12px', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid rgba(197,198,210,0.5)', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={saving} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: cfg.color, color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>}
            {cfg.isDeletion ? 'Eliminar definitivamente' : 'Confirmar'}
          </button>
        </div>

        {/* Modal de credenciales para eliminación */}
        {showCredModal && (
          <CredentialModal
            title="Autorizar eliminación"
            description={`Se eliminarán permanentemente todos los datos de ${nombreCorto}. Ingresa credenciales de Administrador o Supervisor.`}
            icon="delete_forever"
            iconColor="#7f1d1d"
            iconBg="rgba(127,29,29,0.08)"
            confirmLabel="Autorizar y eliminar"
            confirmColor="#7f1d1d"
            onClose={() => setShowCredModal(false)}
            onSuccess={() => {
              setShowCredModal(false);
              executeDelete();
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Action dropdown menu ─────────────────────────────────── */
function ActionMenu({ doc, nombre, estado, profileRoute, editRoute, onAction }) {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) setOpen(false);
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
      const r           = btnRef.current.getBoundingClientRect();
      const MENU_H      = 280; // altura estimada del menú
      const spaceBelow  = window.innerHeight - r.bottom;
      const openUpward  = spaceBelow < MENU_H && r.top > MENU_H;
      setMenuPos({
        top:    openUpward ? undefined : r.bottom + 6,
        bottom: openUpward ? window.innerHeight - r.top + 6 : undefined,
        right:  window.innerWidth - r.right,
      });
    }
    setOpen(o => !o);
  };

  const esActivo     = estado === 'ACTIVO' || !estado;
  const canReactivate = estado === 'INACTIVO' || estado === 'RENUNCIA' || estado === 'FINALIZADO';

  const items = [
    { icon: 'person',  label: 'Ver perfil médico', accent: true,  action: 'ver_perfil' },
    { icon: 'edit',    label: 'Editar carpetas',   accent: false, action: 'editar' },
    ...(esActivo || canReactivate ? [{ divider: true }] : []),
    ...(esActivo ? [
      { icon: 'assignment_return', label: 'Marcar renuncia',      color: '#92400E', action: 'renuncia'   },
      { icon: 'person_off',        label: 'Trasladar a inactivo', color: '#374151', action: 'inactivo'   },
      { icon: 'event_busy',        label: 'Marcar finalización',  color: '#991B1B', action: 'finalizado' },
    ] : []),
    ...(canReactivate ? [
      { icon: 'person_check', label: estado === 'RENUNCIA' ? 'Registrar reingreso' : 'Reactivar médico', color: '#065f46',
        action: estado === 'RENUNCIA' ? 'reingreso' : 'reactivar' },
    ] : []),
    ...(user?.rol === 'admin' ? [
      { divider: true },
      { icon: 'delete_forever', label: 'Eliminar registro', color: '#7f1d1d', action: 'eliminar' },
    ] : []),
  ];

  const dropdown = open && createPortal(
    <div ref={menuRef} style={{
      position: 'fixed',
      top:    menuPos.top    !== undefined ? menuPos.top    : 'auto',
      bottom: menuPos.bottom !== undefined ? menuPos.bottom : 'auto',
      right: menuPos.right,
      background: 'white', borderRadius: 12,
      border: '1px solid rgba(197,198,210,0.3)',
      boxShadow: '0 8px 24px rgba(0,16,62,0.13), 0 2px 6px rgba(0,0,0,0.08)',
      minWidth: 220, zIndex: 9999, overflow: 'hidden',
      animation: 'fadeIn 120ms ease',
    }}>
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(197,198,210,0.15)' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>
          {nombre?.replace(/^Dr[a]?\.?\s+/i, '').split(' ').slice(0, 2).join(' ') ?? 'Médico'}
        </p>
      </div>
      {items.map((item, i) => {
        if (item.divider) return <div key={i} style={{ height: 1, background: 'rgba(197,198,210,0.18)', margin: '2px 0' }} />;
        const itemColor = item.accent ? '#1a4ed7' : (item.color ?? '#334155');
        return (
          <button key={i}
            onClick={e => { e.stopPropagation(); setOpen(false);
              if (item.action === 'ver_perfil') navigate(profileRoute(doc));
              else if (item.action === 'editar') navigate(editRoute(doc));
              else onAction(item.action, doc, nombre, estado);
            }}
            style={{
              width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', fontSize: '0.8125rem',
              fontWeight: item.accent ? 700 : 500,
              color: itemColor,
              background: item.accent ? 'rgba(26,78,215,0.04)' : 'transparent',
              transition: 'background 100ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = item.accent ? 'rgba(26,78,215,0.1)' : '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = item.accent ? 'rgba(26,78,215,0.04)' : 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: itemColor, fontVariationSettings: item.accent ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <div style={{ display: 'inline-block' }}>
      <button ref={btnRef} onClick={handleOpen} title="Acciones"
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(26,78,215,0.1)' : 'transparent',
          color: open ? '#1a4ed7' : '#94a3b8', transition: 'all 130ms',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'rgba(26,78,215,0.08)'; e.currentTarget.style.color = '#1a4ed7'; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
      </button>
      {dropdown}
    </div>
  );
}

/* ── Pagination helpers ───────────────────────────────────── */
function pageRange(cur, tot) {
  if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
  if (cur <= 4) return [1, 2, 3, 4, 5, '…', tot];
  if (cur >= tot - 3) return [1, '…', tot - 4, tot - 3, tot - 2, tot - 1, tot];
  return [1, '…', cur - 1, cur, cur + 1, '…', tot];
}

function PgBtn({ onClick, disabled, active, icon, label }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 30, height: 30, borderRadius: 7, border: 'none',
      cursor: disabled ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.75rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? '#00103e' : 'transparent',
      color: active ? 'white' : '#475569',
      opacity: disabled ? 0.3 : 1, transition: 'all 120ms',
    }}>
      {icon ? <span className="material-symbols-outlined sm">{icon}</span> : label}
    </button>
  );
}

/* ── Skeleton rows ────────────────────────────────────────── */
function SkRow({ cols }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(197,198,210,0.09)' }}>
      <td style={{ padding: '12px 6px 12px 20px', width: 52 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 11 }} />
      </td>
      <td style={{ padding: '12px 16px 12px 10px', minWidth: 180 }}>
        <div className="skeleton" style={{ height: 14, width: '65%', borderRadius: 6, marginBottom: 5 }} />
        <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 6 }} />
      </td>
      {cols.map((c, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div className="skeleton" style={{ height: 13, width: c, borderRadius: 6 }} />
        </td>
      ))}
      <td style={{ padding: '12px 16px' }}>
        <div className="skeleton" style={{ height: 22, width: 72, borderRadius: 9999 }} />
      </td>
      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
        <div className="skeleton" style={{ height: 28, width: 28, borderRadius: 7, marginLeft: 'auto' }} />
      </td>
    </tr>
  );
}

const TH = {
  padding: '11px 16px', textAlign: 'left',
  fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
};

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════ */
export default function MedicoTable({
  apiParams        = {},
  titulo,
  subtitulo,
  emptyIcon        = 'person_search',
  emptyText        = 'No se encontraron resultados',
  statusBadge,
  showFechaIngreso = false,
  showCatFilter    = false,
  showNewBtn       = false,
  newBtnLabel      = 'Nuevo',
  newBtnRoute,
  onNewClick,
  onEstadoAction,        // callback externo opcional para notificar al padre
  refreshKey       = 0,
  SIZE             = 6,
  catList,
  profileRoute     = (doc) => `/medicos/${doc}/perfil`,
  editRoute        = (doc) => `/medicos/${doc}/editar`,
}) {
  const navigate = useNavigate();
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [catFil,  setCatFil]  = useState('');
  const [loading, setLoading] = useState(true);
  const [gestion, setGestion] = useState(null); // { accion, doc, nombre, estadoActual }
  
  const totalPages = Math.max(1, Math.ceil(total / SIZE));

  const fetchData = useCallback(() => {
    setLoading(true);
    
    const params = new URLSearchParams({ page, size: SIZE });
    Object.entries(apiParams).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (search) params.set('search', search);
    if (catFil) params.set('categoria', catFil);
    axiosInstance.get(`/medicos/?${params}`, { skipToast: true })
      .then(r => {
        const d  = r.data;
        const it = Array.isArray(d) ? d : (d.items ?? []);
        const cnt = Array.isArray(d) ? d.length : (d.total ?? it.length);
        setItems(it);
        setTotal(cnt);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, catFil, JSON.stringify(apiParams)]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 320); return () => clearTimeout(t); }, [search, catFil]);
  // Cuando el padre incrementa refreshKey vuelve a la página 1 y refetch
  useEffect(() => { if (refreshKey > 0) { setPage(1); fetchData(); } }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = (accion, doc, nombre, estadoActual) => {
    setGestion({ accion, doc, nombre, estadoActual });
  };

  const handleGestionDone = () => {
    const prev = gestion;
    setGestion(null);
    setPage(1);
    fetchData();
    onEstadoAction?.(prev?.accion, prev?.doc, prev?.nombre);
  };

  const skCols = showFechaIngreso ? ['60%', '55%', '76px'] : ['60%', '55%'];

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1px solid rgba(197,198,210,0.2)',
      boxShadow: '0 2px 16px rgba(0,16,62,0.06)',
      overflow: 'hidden',
    }}>

      {/* ─── Toolbar ─── */}
      <div style={{
        padding: '18px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        borderBottom: '1px solid rgba(197,198,210,0.14)',
        background: '#fcfcfd',
      }}>
        <div>
          {titulo && (
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', lineHeight: 1.3, marginBottom: 3 }}>
              {titulo}
            </h3>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {subtitulo && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{subtitulo}</span>}
            {!loading && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1a4ed7', background: 'rgba(26,78,215,0.08)', padding: '1px 9px', borderRadius: 9999 }}>
                {total} {total === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Buscador */}
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#94a3b8', pointerEvents: 'none' }}>search</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nombre, documento, especialidad..."
              style={{ paddingLeft: 34, paddingRight: 14, paddingBlock: 9, border: '1px solid rgba(197,198,210,0.36)', borderRadius: 10, fontSize: '0.8125rem', width: 280, outline: 'none', background: '#f8f9fb', color: '#191c1e', transition: 'all 150ms' }}
              onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.36)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8f9fb'; }}
            />
          </div>

          {/* Filtro categoría */}
          {showCatFilter && (
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10, gap: 2 }}>
              {['', ...(catList || ['A', 'AE', 'AP'])].map(c => (
                <button key={c || 't'} onClick={() => setCatFil(c)} style={{
                  padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700, transition: 'all 120ms',
                  background: catFil === c ? 'white' : 'transparent',
                  color: catFil === c ? '#1a4ed7' : '#64748b',
                  boxShadow: catFil === c ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>{c === '' ? 'Todos' : `Cat ${c}`}</button>
              ))}
            </div>
          )}

          {/* Botón nuevo */}
          {showNewBtn && (
            <button className="btn btn-signature" onClick={onNewClick ?? (() => navigate(newBtnRoute ?? '/'))}>
              <span className="material-symbols-outlined sm">person_add</span>
              {newBtnLabel}
            </button>
          )}
        </div>
      </div>

      {/* ─── Tabla ─── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 52 }} />
            <col style={{ width: showFechaIngreso ? '26%' : '30%' }} />
            <col style={{ width: showFechaIngreso ? '22%' : '26%' }} />
            <col style={{ width: showFechaIngreso ? '20%' : '24%' }} />
            {showFechaIngreso && <col style={{ width: '11%' }} />}
            <col style={{ width: showFechaIngreso ? '13%' : '14%' }} />
            <col style={{ width: 60 }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(197,198,210,0.16)' }}>
              <th style={{ ...TH, paddingLeft: 20, paddingRight: 6 }}></th>
              <th style={TH}>Médico</th>
              <th style={TH}>Especialidad</th>
              <th style={TH}>Contacto</th>
              {showFechaIngreso && <th style={TH}>Ingreso</th>}
              <th style={TH}>Estado</th>
              <th style={{ ...TH, textAlign: 'right', paddingRight: 20 }}>Acc.</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <SkRow key={i} cols={skCols} />)
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={6 + (showFechaIngreso ? 1 : 0)} style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#c8d2df' }}>{emptyIcon}</span>
                      </div>
                      <p style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9375rem' }}>{emptyText}</p>
                      {search && <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Intenta con otro término de búsqueda</p>}
                    </div>
                  </td>
                </tr>
              )
              : items.map((m, i) => {
                  const cat = m.categoria ?? '';
                  return (
                    <tr
                      key={m.documento_identidad ?? i}
                      style={{ borderBottom: '1px solid rgba(197,198,210,0.1)', transition: 'background 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,78,215,0.018)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Avatar */}
                      <td style={{ padding: '12px 0 12px 20px' }}>
                        <DoctorAvatar name={m.nombre_medico} cat={cat} size={40} radius={11} />
                      </td>

                      {/* Médico: nombre + documento */}
                      <td style={{ padding: '12px 10px 12px 16px', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#00103e', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {safe(m.nombre_medico)}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                          {safe(m.documento_identidad)}
                          {cat && (
                            <span style={{ marginLeft: 6, background: getAvatarColor(cat, '').bg, color: getAvatarColor(cat, '').color, fontWeight: 700, fontSize: '0.625rem', padding: '1px 7px', borderRadius: 9999 }}>
                              {cat}
                            </span>
                          )}
                        </p>
                      </td>

                      {/* Especialidad + sección */}
                      <td style={{ padding: '12px 16px', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {safe(m.especialidad)}
                        </p>
                        {m.seccion_nombre && (
                          <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.seccion_nombre}
                          </p>
                        )}
                      </td>

                      {/* Contacto: correo + celular */}
                      <td style={{ padding: '12px 16px', overflow: 'hidden' }}>
                        {m.correo
                          ? <p style={{ fontSize: '0.75rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.correo}</p>
                          : <span style={{ color: '#c8d2df', fontSize: '0.75rem' }}>—</span>
                        }
                        {m.celular && (
                          <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{m.celular}</p>
                        )}
                      </td>

                      {/* Fecha ingreso (opcional) */}
                      {showFechaIngreso && (
                        <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {fmtDate(m.fecha_ingreso)}
                        </td>
                      )}

                      {/* Estado */}
                      <td style={{ padding: '12px 16px' }}>
                        {statusBadge
                          ? statusBadge(m)
                          : <EstadoBadge estado={m.estado} />
                        }
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <ActionMenu
                          doc={m.documento_identidad}
                          nombre={m.nombre_medico}
                          estado={m.estado}
                          profileRoute={profileRoute}
                          editRoute={editRoute}
                          onAction={handleAction}
                        />
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* ─── Paginación ─── */}
      {!loading && total > 0 && (
        <div style={{
          padding: '12px 24px', borderTop: '1px solid rgba(197,198,210,0.13)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16, background: '#fcfcfd',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Mostrando {items.length} de {total} resultado{total !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <PgBtn icon="chevron_left" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
            {pageRange(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`dots-${i}`} style={{ color: '#94a3b8', padding: '0 4px', fontSize: '0.75rem' }}>…</span>
              ) : (
                <PgBtn key={p} label={p} active={p === page} onClick={() => setPage(p)} />
              )
            )}
            <PgBtn icon="chevron_right" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {gestion && (
        <GestionModal
          accion={gestion.accion}
          doc={gestion.doc}
          nombre={gestion.nombre}
          estadoActual={gestion.estadoActual}
          onClose={() => setGestion(null)}
          onDone={handleGestionDone}
        />
      )}
    </div>
  );
}
