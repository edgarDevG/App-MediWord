import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../components/Toast';

/* ── Constantes de roles ─────────────────────────────────────── */
const ROLES = [
  { value: 'admin',      label: 'Administrador', bg: '#0A1628', color: '#fff'     },
  { value: 'supervisor', label: 'Supervisor',    bg: '#f3e8ff', color: '#6b21a8'  },
  { value: 'editor',     label: 'Editor',        bg: '#d1fae5', color: '#065f46'  },
  { value: 'viewer',     label: 'Solo lectura',  bg: '#e2e8f0', color: '#334155'  },
];
const ROL_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]));

function RolBadge({ rol }) {
  const r = ROL_MAP[rol] ?? { label: rol, bg: '#e2e8f0', color: '#334155' };
  return (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 700, padding: '2px 10px',
      borderRadius: 9999, background: r.bg, color: r.color,
      border: r.value === 'admin' ? 'none' : `1px solid ${r.color}22`,
    }}>
      {r.label}
    </span>
  );
}

function ActiveBadge({ activo }) {
  return (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 700, padding: '2px 10px',
      borderRadius: 9999,
      background: activo ? 'rgba(6,95,70,0.08)' : 'rgba(220,38,38,0.08)',
      color: activo ? '#065f46' : '#dc2626',
    }}>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

/* ── Modal de usuario (crear / editar) ───────────────────────── */
function ModalUsuario({ usuario, onClose, onSaved, showToast }) {
  const isEdit = !!usuario;
  const [form, setForm] = useState({
    username:  usuario?.username  ?? '',
    nombre:    usuario?.nombre    ?? '',
    email:     usuario?.email     ?? '',
    rol:       usuario?.rol       ?? 'viewer',
    password:  '',
    activo:    usuario?.activo    ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.username.trim()) { showToast('El usuario es requerido', 'error'); return; }
    if (!isEdit && !form.password.trim()) { showToast('La contraseña es requerida', 'error'); return; }
    if (!isEdit && form.password.length < 6) { showToast('Mínimo 6 caracteres en la contraseña', 'error'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { nombre: form.nombre || null, email: form.email || null, rol: form.rol, activo: form.activo };
        await axiosInstance.put(`/users/${usuario.id}`, payload);
        showToast('Usuario actualizado', 'success');
      } else {
        const payload = { username: form.username.trim(), password: form.password, nombre: form.nombre || null, email: form.email || null, rol: form.rol };
        await axiosInstance.post('/users/', payload);
        showToast('Usuario creado correctamente', 'success');
      }
      onSaved();
    } catch (e) {
      showToast(e.response?.data?.detail ?? 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 48px rgba(10,22,40,0.18)', padding: '2rem',
      }}>
        <h3 style={{ fontWeight: 800, color: '#0A1628', marginBottom: 4, fontSize: '1.0625rem' }}>
          {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          {isEdit ? `Modificando: ${usuario.username}` : 'Completa los campos para crear un acceso'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username — solo en creación */}
          {!isEdit && (
            <div>
              <label className="form-label">Usuario *</label>
              <input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="ej. jperez" />
            </div>
          )}

          <div>
            <label className="form-label">Nombre completo</label>
            <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="ej. Juan Pérez" />
          </div>

          <div>
            <label className="form-label">Correo electrónico</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ej. jperez@chsm.com" />
          </div>

          <div>
            <label className="form-label">Rol *</label>
            <select className="form-input" value={form.rol} onChange={e => set('rol', e.target.value)}>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Password — solo en creación */}
          {!isEdit && (
            <div>
              <label className="form-label">Contraseña *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          )}

          {/* Activo — solo en edición */}
          {isEdit && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0A1628' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Usuario activo</span>
            </label>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.75rem' }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 9, border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 22px', borderRadius: 9, border: 'none',
            background: '#0A1628', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Modal de reset de contraseña ────────────────────────────── */
function ModalResetPassword({ usuario, onClose, showToast }) {
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = async () => {
    if (!pwd || pwd.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }
    setSaving(true);
    try {
      await axiosInstance.post(`/users/${usuario.id}/reset-password`, { nueva_password: pwd });
      showToast(`Contraseña de "${usuario.username}" restablecida`, 'success');
      onClose();
    } catch (e) {
      showToast(e.response?.data?.detail ?? 'Error al restablecer', 'error');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400,
        boxShadow: '0 24px 48px rgba(10,22,40,0.18)', padding: '2rem',
      }}>
        <h3 style={{ fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Restablecer Contraseña</h3>
        <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
          Usuario: <strong>{usuario.username}</strong>
        </p>
        <label className="form-label">Nueva contraseña *</label>
        <input
          className="form-input" type="password" value={pwd}
          onChange={e => setPwd(e.target.value)} placeholder="Mínimo 6 caracteres"
          style={{ marginBottom: '1.5rem' }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 9, border: '1px solid #e2e8f0',
            background: '#f8fafc', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
          }}>
            Cancelar
          </button>
          <button onClick={handleReset} disabled={saving} style={{
            padding: '8px 22px', borderRadius: 9, border: 'none',
            background: '#dc2626', color: '#fff', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Guardando...' : 'Restablecer'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Tabla de usuarios ───────────────────────────────────────── */
function GestionUsuarios({ showToast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEdit, setModalEdit] = useState(null);   // null | usuario
  const [modalNew, setModalNew] = useState(false);
  const [modalPwd, setModalPwd] = useState(null);     // null | usuario

  const cargar = () => {
    setLoading(true);
    axiosInstance.get('/users/')
      .then(r => setUsuarios(r.data))
      .catch(() => showToast('Error al cargar usuarios', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const onSaved = () => { cargar(); setModalEdit(null); setModalNew(false); };

  return (
    <div>
      {/* ── Encabezado sección ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontWeight: 800, color: '#0A1628', fontSize: '0.9375rem', margin: 0 }}>
            Usuarios del Sistema
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '2px 0 0' }}>
            Gestiona accesos, roles y contraseñas
          </p>
        </div>
        <button
          onClick={() => setModalNew(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 9, border: 'none',
            background: '#0A1628', color: '#fff', fontWeight: 700,
            fontSize: '0.8125rem', cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          Nuevo usuario
        </button>
      </div>

      {/* ── Tabla ── */}
      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #e8eaf0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fb' }}>
              {['Usuario', 'Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left', fontWeight: 700,
                  color: '#64748b', fontSize: '0.6875rem', textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: '1px solid #e8eaf0', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5' }}>
                      <div className="skeleton" style={{ height: 18, borderRadius: 6, width: j === 5 ? 80 : '70%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map(u => (
                <tr key={u.id} style={{ transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#0A1628' }}>
                    {u.username}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5', color: '#374151' }}>
                    {u.nombre || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5', color: '#64748b' }}>
                    {u.email || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5' }}>
                    <RolBadge rol={u.rol} />
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5' }}>
                    <ActiveBadge activo={u.activo} />
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setModalEdit(u)}
                        title="Editar usuario"
                        style={btnStyle('#f1f5f9', '#334155')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
                      </button>
                      <button
                        onClick={() => setModalPwd(u)}
                        title="Restablecer contraseña"
                        style={btnStyle('#fef3c7', '#92400e')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>key</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modales ── */}
      {modalNew   && <ModalUsuario onClose={() => setModalNew(false)} onSaved={onSaved} showToast={showToast} />}
      {modalEdit  && <ModalUsuario usuario={modalEdit} onClose={() => setModalEdit(null)} onSaved={onSaved} showToast={showToast} />}
      {modalPwd   && <ModalResetPassword usuario={modalPwd} onClose={() => setModalPwd(null)} showToast={showToast} />}
    </div>
  );
}

const btnStyle = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 7, border: 'none',
  background: bg, color: color, cursor: 'pointer',
  transition: 'opacity 120ms',
});

/* ── ConfigPage ──────────────────────────────────────────────── */
const TABS = [
  { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'manage_accounts' },
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const { showToast, ToastContainer } = useToast();

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Configuración</h2>
          <p>Panel de administración del sistema</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.75rem', borderBottom: '1px solid #e8eaf0', paddingBottom: 0 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', border: 'none', cursor: 'pointer',
                background: 'none', fontWeight: active ? 700 : 500,
                color: active ? '#0A1628' : '#94a3b8',
                borderBottom: active ? '2px solid #0A1628' : '2px solid transparent',
                marginBottom: -1, fontSize: '0.875rem', transition: 'all 120ms',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenido ── */}
      <div style={{
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
        borderRadius: 18, border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '1.75rem',
      }}>
        {activeTab === 'usuarios' && <GestionUsuarios showToast={showToast} />}
      </div>

      <ToastContainer />
    </div>
  );
}
