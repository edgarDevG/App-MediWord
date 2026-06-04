/* ══════════════════════════════════════════════════════════════
   ExpedienteTab.jsx — MediWork HSM
   Explorador de carpetas y archivos en el perfil del médico.

   Decisiones de diseño:
   - Una sola GET /medicos/{doc}/archivos/ al montar → agrupa por carpeta en frontend
   - 15 carpetas siempre visibles (aunque estén vacías)
   - Cuadrícula de tarjetas de archivo
   - Panel lateral (slide-over) con metadata + preview
   - Drag-and-drop y botón Subir por carpeta
   - Eliminar visible solo para admin / supervisor
══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getAvatarColor, getInitials } from '../../components/shared/DoctorAvatar';

/* ── Definición canónica de las 15 carpetas ── */
const CARPETAS = [
  { key: 'hoja_vida',              label: 'Hoja de Vida',          icon: 'person'              },
  { key: 'habilitacion',           label: 'Habilitación',          icon: 'verified'            },
  { key: 'diplomas_verificaciones',label: 'Diplomas / Verif.',     icon: 'school'              },
  { key: 'normativos',             label: 'Normativos',            icon: 'policy'              },
  { key: 'prerrogativas',          label: 'Prerrogativas',         icon: 'shield_person'       },
  { key: 'ingreso',                label: 'Ingreso',               icon: 'login'               },
  { key: 'contratacion',           label: 'Contratación',          icon: 'handshake'           },
  { key: 'cursos_ingreso',         label: 'Cursos Ingreso',        icon: 'menu_book'           },
  { key: 'educacion_continuada',   label: 'Educ. Continua',        icon: 'auto_stories'        },
  { key: 'entrenam_inducciones',   label: 'Entren. Inducciones',   icon: 'fitness_center'      },
  { key: 'act_formacion_continua', label: 'Act. Form. Continua',   icon: 'edit_note'           },
  { key: 'evaluacion_desempeno',   label: 'Eval. Desempeño',       icon: 'assessment'          },
  { key: 'correspond_certificados',label: 'Corresp. y Certif.',    icon: 'mail'                },
  { key: 'vacaciones_ausencias',   label: 'Vacac. y Ausencias',    icon: 'event_available'     },
  { key: 'varios',                 label: 'Varios',                icon: 'folder_special'      },
];

/* ── Helpers ── */
const fmtBytes = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
};

/* ── Abrir archivo autenticado via axios → blob URL ── */
async function openArchivo(urlDescarga) {
  if (!urlDescarga) return;
  try {
    // Normalizar: quitar /api/v1 si viene en urlDescarga (evita duplicación con baseURL)
    const apiPath = urlDescarga.includes('/api/v1')
      ? urlDescarga.slice(urlDescarga.indexOf('/api/v1') + '/api/v1'.length)
      : urlDescarga;
    const resp = await axiosInstance.get(apiPath, { responseType: 'blob' });
    const url  = URL.createObjectURL(resp.data);
    const a    = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch { /* silencioso */ }
}

/* ══ SUBCOMPONENTE: Sidebar de carpetas ══════════════════════ */
function FoldersSidebar({ carpetaActiva, onSelect, conteos }) {
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(10,37,64,.06)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        fontSize: 10,
        fontWeight: 700,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '.09em',
        flexShrink: 0,
      }}>
        Carpetas
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px', scrollbarWidth: 'none' }}>
        {CARPETAS.map(c => {
          const count = conteos[c.key] ?? 0;
          const activa = carpetaActiva === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 10px',
                border: 'none', borderRadius: 8,
                background: activa ? 'rgba(16,185,129,.08)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 100ms',
                gap: 8,
              }}
              onMouseEnter={e => { if (!activa) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (!activa) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 18, flexShrink: 0,
                  color: activa ? '#10b981' : '#94a3b8',
                  fontVariationSettings: activa ? "'FILL' 1" : "'FILL' 0",
                }}>
                  {activa ? 'folder_open' : c.icon}
                </span>
                <span style={{
                  fontSize: '0.8125rem',
                  color: activa ? '#10b981' : '#475569',
                  fontWeight: activa ? 700 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.label}
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 10,
                flexShrink: 0,
                background: activa
                  ? '#fff'
                  : count > 0 ? 'rgba(16,185,129,.08)' : '#f1f5f9',
                color: activa
                  ? '#10b981'
                  : count > 0 ? '#10b981' : '#94a3b8',
                border: activa ? '1px solid rgba(16,185,129,.25)' : 'none',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`.folders-sidebar::-webkit-scrollbar{display:none}`}</style>
    </aside>
  );
}

/* ══ SUBCOMPONENTE: Tarjeta de archivo ══════════════════════ */
function FileCard({ archivo, selected, onSelect, onDelete, canDelete, baseURL }) {
  const handleView = (e) => { e.stopPropagation(); openArchivo(archivo.url_descarga); };
  const handleDel  = (e) => { e.stopPropagation(); onDelete(archivo); };

  return (
    <div
      onClick={() => onSelect(archivo)}
      style={{
        background: '#fff',
        border: `1px solid ${selected ? '#10b981' : '#e2e8f0'}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px rgba(16,185,129,.15)' : '0 1px 3px rgba(10,37,64,.06)',
        transition: 'box-shadow 140ms, transform 140ms',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(10,37,64,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,37,64,.06)'; e.currentTarget.style.transform = ''; } }}
    >
      {/* Thumb */}
      <div style={{ height: 88, background: 'linear-gradient(145deg, #fef2f2, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#ef4444', fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
        <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
          <button type="button" onClick={handleView} className="fc-btn"
            style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,.92)', border: '1px solid rgba(10,37,64,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0 }}
            title="Abrir PDF">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#475569' }}>visibility</span>
          </button>
          {canDelete && (
            <button type="button" onClick={handleDel} className="fc-btn del-btn"
              style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,.92)', border: '1px solid rgba(10,37,64,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0 }}
              title="Eliminar archivo">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ba1a1a' }}>delete</span>
            </button>
          )}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {archivo.nombre_original}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          {archivo.tipo_doc && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: 'rgba(16,185,129,.08)', color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 95 }}>
              {archivo.tipo_doc}
            </span>
          )}
          <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 'auto', flexShrink: 0 }}>{fmtBytes(archivo.tamano_bytes)}</span>
        </div>
        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
          {fmtDate(archivo.fecha_subida)}{archivo.subido_por ? ` · ${archivo.subido_por}` : ''}
        </div>
      </div>
    </div>
  );
}

/* ══ SUBCOMPONENTE: Panel lateral de preview ════════════════ */
function PreviewPanel({ archivo, onClose, onDelete, canDelete, baseURL }) {
  if (!archivo) return null;
  return (
    <aside style={{
      width: 300, flexShrink: 0,
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(10,37,64,.06)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Vista previa</span>
        <button type="button" onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>close</span>
        </button>
      </div>
      <div style={{ height: 180, background: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 52, color: '#ef4444', fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', textAlign: 'center', padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {archivo.nombre_original}
        </span>
        <button type="button" onClick={() => openArchivo(archivo.url_descarga)}
          style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.9)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
          Abrir en nueva pestaña
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'thin' }}>
        <MetaSection title="Información del archivo" rows={[
          { label: 'Nombre original',   value: archivo.nombre_original },
          { label: 'Tipo de documento', value: archivo.tipo_doc,  pill: 'blue' },
          { label: 'Campo origen',      value: archivo.campo_ref, pill: 'mono' },
          { label: 'Carpeta',           value: archivo.carpeta },
          { label: 'Tamaño',            value: fmtBytes(archivo.tamano_bytes) },
          { label: 'MIME',              value: archivo.mime_type },
        ]} />
        <MetaSection title="Auditoría" rows={[
          { label: 'Subido por',   value: archivo.subido_por || '—' },
          { label: 'Fecha subida', value: fmtDateTime(archivo.fecha_subida) },
        ]} />
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => openArchivo(archivo.url_descarga)}
            style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
            Descargar
          </button>
          {canDelete && (
            <button type="button" onClick={() => onDelete(archivo)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(186,26,26,.07)', color: '#ba1a1a', border: '1px solid rgba(186,26,26,.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
              Eliminar
            </button>
          )}
        </div>
        {!canDelete && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 10, color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>lock</span>
            Eliminación restringida a admin / supervisor
          </div>
        )}
      </div>
    </aside>
  );
}

function MetaSection({ title, rows }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{title}</div>
      {rows.filter(r => r.value).map(r => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
          <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{r.label}</span>
          {r.pill === 'blue'
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(16,185,129,.08)', color: '#10b981' }}>{r.value}</span>
            : r.pill === 'mono'
            ? <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontFamily: 'monospace' }}>{r.value}</span>
            : <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{r.value}</span>
          }
        </div>
      ))}
    </div>
  );
}

/* ══ SUBCOMPONENTE: Modal de confirmación de eliminación ════ */
function ConfirmDeleteModal({ archivo, onConfirm, onCancel }) {
  if (!archivo) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(186,26,26,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#ba1a1a', fontVariationSettings: "'FILL' 1" }}>delete</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Eliminar archivo</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Esta acción no se puede deshacer</p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', marginBottom: 18, wordBreak: 'break-all' }}>
          {archivo.nombre_original}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="button" onClick={() => onConfirm(archivo)}
            style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#ba1a1a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ══════════════════════════════════ */
export default function ExpedienteTab({ medicoDoc: medicoDocProp }) {
  const params     = useParams();
  const navigate   = useNavigate();
  const medicoDoc  = medicoDocProp ?? params.doc;
  const esVistaPag = !medicoDocProp;

  const { hasRole } = useAuth();
  const canDelete = hasRole('admin', 'supervisor');
  const baseURL   = axiosInstance.defaults.baseURL || '';

  const [med,              setMed]              = useState(null);
  const [archivos,         setArchivos]         = useState([]);
  const [loading,          setLoading]           = useState(true);
  const [error,            setError]             = useState(null);
  const [carpetaActiva,    setCarpetaActiva]     = useState(CARPETAS[0].key);
  const [archivoSelec,     setArchivoSelec]      = useState(null);
  const [archivoAEliminar, setArchivoAEliminar]  = useState(null);
  const [dragging,         setDragging]          = useState(false);
  const [uploading,        setUploading]         = useState(false);
  const [uploadError,      setUploadError]       = useState(null);
  const fileInputRef = useRef(null);

  /* ── Carga inicial ── */
  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rArchivos, rMed] = await Promise.allSettled([
        axiosInstance.get(`/medicos/${medicoDoc}/archivos/`, { skipToast: true }),
        axiosInstance.get(`/medicos/${medicoDoc}/`, { skipToast: true }),
      ]);
      if (rArchivos.status === 'fulfilled') setArchivos(rArchivos.value.data || []);
      else if (rArchivos.reason?.response?.status !== 404) setError('No se pudieron cargar los archivos.');
      if (rMed.status === 'fulfilled') setMed(rMed.value.data);
    } catch (e) {
      if (e.response?.status !== 404) setError('No se pudieron cargar los archivos.');
    } finally {
      setLoading(false);
    }
  }, [medicoDoc]);

  useEffect(() => { cargar(); }, [cargar]);

  const conteos = archivos.reduce((acc, a) => {
    acc[a.carpeta] = (acc[a.carpeta] ?? 0) + 1;
    return acc;
  }, {});

  const archivosDeCarpeta = archivos.filter(a => a.carpeta === carpetaActiva);
  const totalArchivos     = archivos.length;

  const handleSelectCarpeta = (key) => {
    setCarpetaActiva(key);
    setArchivoSelec(null);
    setUploadError(null);
  };

  const subirArchivo = async (file) => {
    if (!file || file.type !== 'application/pdf') { setUploadError('Solo se permiten archivos PDF.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError(`"${file.name}" supera el límite de 10 MB.`); return; }
    setUploadError(null); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file, file.name);
      fd.append('carpeta', carpetaActiva);
      const { data } = await axiosInstance.post(`/medicos/${medicoDoc}/archivos/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setArchivos(prev => [data, ...prev]);
      setArchivoSelec(data);
    } catch (e) {
      const msg = e?.response?.data?.detail;
      setUploadError(typeof msg === 'string' ? msg : 'Error al subir el archivo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInput = (e) => { const f = e.target.files?.[0]; if (f) subirArchivo(f); };
  const handleDrop      = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) subirArchivo(f); };
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const pedirEliminar    = (archivo) => setArchivoAEliminar(archivo);
  const cancelarEliminar = () => setArchivoAEliminar(null);

  const confirmarEliminar = async (archivo) => {
    try {
      await axiosInstance.delete(`/medicos/${medicoDoc}/archivos/${archivo.id}/`);
      setArchivos(prev => prev.filter(a => a.id !== archivo.id));
      if (archivoSelec?.id === archivo.id) setArchivoSelec(null);
    } catch { /* toast ya maneja el error */ }
    finally { setArchivoAEliminar(null); }
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: 10, padding: 40 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22, animation: 'spin 1s linear infinite', color: '#10b981' }}>progress_activity</span>
      Cargando expediente…
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#ba1a1a', padding: 40 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32 }}>error</span>
      <p style={{ fontSize: 13 }}>{error}</p>
      <button type="button" onClick={cargar} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
        Reintentar
      </button>
    </div>
  );

  const carpetaInfo = CARPETAS.find(c => c.key === carpetaActiva);

  /* ── Identidad del médico ── */
  const _partes = med
    ? [med.primer_nombre, med.segundo_nombre, med.primer_apellido, med.segundo_apellido].filter(Boolean).join(' ')
    : '';
  const nombreMed  = med?.nombre_medico?.trim() || _partes || medicoDoc;
  const avatarCl   = getAvatarColor(med?.categoria, nombreMed);
  const initials   = getInitials(nombreMed);
  const activo     = med?.estado === 'ACTIVO' || med?.activo !== false;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%',
      background: esVistaPag ? '#F8FAFC' : 'transparent',
      margin: esVistaPag ? '0 -32px' : 0,
    }}>

      {/* ── Header página completa ── */}
      {esVistaPag && (
        <div style={{ padding: '1.5rem 2rem 1.25rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: '#64748b', marginBottom: 12 }}>
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#10b981', fontWeight: 600, transition: 'color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#059669'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#10b981'; }}>
              Médicos
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#cbd5e1' }}>chevron_right</span>
            <span onClick={() => navigate(`/medicos/${medicoDoc}/perfil`)} style={{ cursor: 'pointer', color: '#10b981', fontWeight: 600, transition: 'color 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#059669'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#10b981'; }}>
              Perfil Médico
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#cbd5e1' }}>chevron_right</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>Expediente</span>
          </nav>

          {/* Título + acciones */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            {/* Tarjeta identidad médico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: avatarCl.bg,
                border: `2px solid ${avatarCl.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.125rem', fontWeight: 800, color: avatarCl.color,
                letterSpacing: '-0.02em', lineHeight: 1,
                boxShadow: `0 2px 8px ${avatarCl.color}20`,
                position: 'relative',
              }}>
                {initials}
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 12, height: 12, borderRadius: '50%',
                  background: activo ? '#10b981' : '#94a3b8',
                  border: '2px solid #fff',
                }} />
              </div>
              {/* Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {nombreMed}
                  </h1>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                    letterSpacing: '.03em', whiteSpace: 'nowrap',
                  }}>
                    {medicoDoc}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  {[med?.cargo, med?.especialidad].filter(Boolean).join(' · ') || 'Médico'}
                  <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>
                  {totalArchivos} archivo{totalArchivos !== 1 ? 's' : ''} · {CARPETAS.length} carpetas
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/medicos/${medicoDoc}/perfil`)}
              className="btn btn-signature"
            >
              <span className="material-symbols-outlined sm">arrow_back</span>
              Volver al perfil
            </button>
          </div>
        </div>
      )}

      {/* ── Cuerpo: sidebar + content area ── */}
      <div style={{ flex: 1, display: 'flex', gap: 20, padding: '1.5rem 2rem', overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar carpetas */}
        <FoldersSidebar
          carpetaActiva={carpetaActiva}
          onSelect={handleSelectCarpeta}
          conteos={conteos}
        />

        {/* Content area */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(10,37,64,.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Content header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#10b981', fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{carpetaInfo?.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                Total: {archivosDeCarpeta.length}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: '#10b981', color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: '0.875rem', fontWeight: 600, cursor: uploading ? 'default' : 'pointer',
                  opacity: uploading ? .6 : 1,
                  boxShadow: '0 1px 3px rgba(16,185,129,.3)',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = '#059669'; }}
                onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = '#10b981'; }}
              >
                {uploading
                  ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                }
                {uploading ? 'Subiendo…' : 'Subir PDF'}
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleFileInput} />
            </div>
          </div>

          {/* Zona scrollable: upload + grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>

            {/* Upload zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                borderRadius: 12,
                padding: '28px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
                background: dragging ? 'rgba(16,185,129,.05)' : 'rgba(255,255,255,.5)',
                backgroundImage: dragging
                  ? `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%2310b981' stroke-width='2' stroke-dasharray='8%2c 8' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`
                  : `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23CBD5E1FF' stroke-width='2' stroke-dasharray='8%2c 8' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                transition: 'all 150ms',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: dragging ? 'rgba(16,185,129,.15)' : 'rgba(16,185,129,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#10b981' }}>upload_file</span>
              </div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                {dragging ? 'Suelta aquí el PDF' : 'Arrastra un PDF o haz clic para subir'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>Tamaño máximo: 10MB</p>
            </div>

            {/* Error upload */}
            {uploadError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(186,26,26,.06)', border: '1px solid rgba(186,26,26,.15)', borderRadius: 8, fontSize: 12, color: '#ba1a1a' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>
                {uploadError}
              </div>
            )}

            {/* Grid de archivos o empty state */}
            {archivosDeCarpeta.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#e2e8f0', display: 'block', marginBottom: 14 }}>folder</span>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b', margin: 0 }}>Esta carpeta está vacía</p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '6px 0 0' }}>Sube documentos para empezar a organizar este expediente.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {archivosDeCarpeta.map(a => (
                  <FileCard
                    key={a.id}
                    archivo={a}
                    selected={archivoSelec?.id === a.id}
                    onSelect={setArchivoSelec}
                    onDelete={pedirEliminar}
                    canDelete={canDelete}
                    baseURL={baseURL}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel preview lateral */}
        {archivoSelec && (
          <PreviewPanel
            archivo={archivoSelec}
            onClose={() => setArchivoSelec(null)}
            onDelete={pedirEliminar}
            canDelete={canDelete}
            baseURL={baseURL}
          />
        )}
      </div>

      {/* Modal confirmar eliminación */}
      {archivoAEliminar && (
        <ConfirmDeleteModal
          archivo={archivoAEliminar}
          onConfirm={confirmarEliminar}
          onCancel={cancelarEliminar}
        />
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fc-btn { transition: opacity 120ms; }
        div:hover > div > .fc-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
