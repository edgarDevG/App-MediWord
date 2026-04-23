import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   Tab3: Académica y Habilitación
   Endpoints:
     /medicos/{doc}/diplomas-verificaciones  (académica)
     /medicos/{doc}/normativos               (hab docs: rethus, tarjeta_prof, examen)
     /medicos/{doc}/accesos                  (hab docs: poliza)
     /medicos/{doc}/documentos-hv            (hab docs: antecedentes)
     /medicos/{doc}/contratacion             (hab docs: contrato prestacion)
   ══════════════════════════════════════════════════════════════ */

const OPT_VERIF = [
  { value: 'PENDIENTE', label: 'Pendiente'      },
  { value: 'SI',        label: 'Sí — Verificado'},
  { value: 'NA',        label: 'N/A'            },
];

const INIT = {
  cartasolicvericredenciales: '', soporteverificaciontitulos: '', fechaverificaciontitulos: '',
  titulomedgeneralodontologo: '', actamedgeneralodontologo: '', tituloprofesional: '',
  universidadtituloprofesional: '', paisuniversidadtituloprofesional: '',
  actaconvalidacionprofesional: '', verifporcredtituloprofesional: '',
  diplomaespecialidad1: '', actaespecialidad1: '', tituloesp1: '',
  universidadespecialidad1: '', paisuniversidadespecialidad1: '',
  actaconvalidacionespecialidad1: '', verifporcredespecialidad1: '',
  diplomasubespecialidad2: '', actasubespecialidad2: '', titulosubesp2: '',
  universidadsubespecialidad2: '', paisuniversidadsubespecialidad2: '',
  actaconvalidacionsubespecialidad2: '', verifporcredsubespecialidad2: '',
  diplomasubespecialidad3: '', actasubespecialidad3: '', titulosubesp3: '',
  universidadsubespecialidad3: '', paisuniversidadsubespecialidad3: '',
  actaconvalidacionsubespecialidad3: '', verifporcredsubespecialidad3: '',
  diplomaotrasespecialidades: '', detalleotrosestudiosformales: '',
  verifporcredotrosestudios: '', certentrenamavanzado: '',
  detalleotrosentrenamientosavanzados: '',
};

/* ── Habilitación docs ── */
const DOCS_HABILITACION = [
  { key: 'rethus',                      label: 'RETHUS',                              icon: 'verified',            required: true  },
  { key: 'tarjeta_profesional',         label: 'Tarjeta Profesional',                 icon: 'badge',               required: true  },
  { key: 'poliza_responsabilidad',      label: 'Póliza de Responsabilidad Civil',     icon: 'security',            required: true  },
  { key: 'certificado_especialidad',    label: 'Certificado de Especialidad',         icon: 'school',              required: true  },
  { key: 'examen_medico',               label: 'Examen Médico Ocupacional',           icon: 'medical_information', required: true  },
  { key: 'diploma_pregrado',            label: 'Diploma de Pregrado',                 icon: 'menu_book',           required: false },
  { key: 'antecedentes_disciplinarios', label: 'Cert. Antecedentes Disciplinarios',   icon: 'gavel',               required: false },
  { key: 'antecedentes_judiciales',     label: 'Cert. Antecedentes Judiciales',       icon: 'policy',              required: false },
  { key: 'contrato_prestacion',         label: 'Contrato / Prestación de Servicios',  icon: 'description',         required: false },
];

const INIT_DOC = {
  tipo_documento_hv: '', numero_documento_hv: '', fecha_expedicion: '',
  fecha_vencimiento: '', entidad_expide: '', observaciones: '',
  tiene_documento: false, _id: null,
};

function diasParaVencer(fechaStr) {
  if (!fechaStr) return null;
  return Math.ceil((new Date(fechaStr + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
}

function EstadoVencimiento({ fecha }) {
  if (!fecha) return <span className="badge badge-neutral">Sin fecha</span>;
  const dias = diasParaVencer(fecha);
  if (dias < 0)   return <span className="badge badge-vencido"><span className="material-symbols-outlined sm">cancel</span> Vencido hace {Math.abs(dias)}d</span>;
  if (dias <= 15) return <span className="badge badge-por-vencer"><span className="material-symbols-outlined sm">schedule</span> Vence en {dias}d</span>;
  return <span className="badge badge-vigente"><span className="material-symbols-outlined sm">check_circle</span> Vigente</span>;
}

/* ── Campos académicos ── */
function Campo({ label, name, value, onChange, disabled, placeholder, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="form-input"
        value={value ?? ''} onChange={onChange} disabled={disabled} placeholder={placeholder ?? ''} />
    </div>
  );
}

function CampoSelect({ label, name, value, onChange, options = [], placeholder = 'Seleccionar...' }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <select id={name} name={name} className="form-select" value={value ?? ''} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── DocPanel habilitación ── */
function DocPanel({ doc, data, onChange, onToggle }) {
  const vigencia  = data.fecha_vencimiento ? diasParaVencer(data.fecha_vencimiento) : null;
  const isAlerta  = vigencia !== null && vigencia <= 15;
  return (
    <div style={{
      background: data.tiene_documento ? 'white' : 'var(--color-surface-container-low)',
      border: `1px solid ${isAlerta && data.tiene_documento ? 'rgba(186,26,26,0.25)' : 'rgba(197,198,210,0.4)'}`,
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', transition: 'all 180ms ease',
      boxShadow: data.tiene_documento ? 'var(--shadow-sm)' : 'none',
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'var(--space-4) var(--space-5)', cursor:'pointer',
        background: data.tiene_documento ? 'rgba(26,78,215,0.04)' : 'transparent',
        borderBottom: data.tiene_documento ? '1px solid rgba(197,198,210,0.25)' : 'none',
      }} onClick={() => onToggle(doc.key)}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:38, height:38, borderRadius:'var(--radius-lg)', flexShrink:0,
            background: data.tiene_documento ? (isAlerta ? 'rgba(186,26,26,0.1)' : 'rgba(26,78,215,0.08)') : 'var(--color-surface-container)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span className="material-symbols-outlined" style={{ color: data.tiene_documento ? (isAlerta ? 'var(--color-error)' : 'var(--color-secondary)') : '#94a3b8', fontSize: 20 }}>{doc.icon}</span>
          </div>
          <div>
            <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-primary)', display:'flex', alignItems:'center', gap:6 }}>
              {doc.label}
              {doc.required && <span style={{ fontSize:'0.6875rem', color:'var(--color-error)', fontWeight:700 }}>*</span>}
            </p>
            {data.tiene_documento && data.fecha_vencimiento && (
              <p style={{ fontSize:'0.6875rem', color:'#64748b', marginTop:1 }}>
                Vence: {new Date(data.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
              </p>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {data.tiene_documento && <EstadoVencimiento fecha={data.fecha_vencimiento} />}
          <div onClick={e => { e.stopPropagation(); onToggle(doc.key); }}
            style={{ width:44, height:24, borderRadius:'var(--radius-full)', cursor:'pointer', transition:'background 180ms ease', flexShrink:0, position:'relative',
              background: data.tiene_documento ? 'var(--color-secondary)' : 'var(--color-surface-container-highest)',
            }} role="switch" aria-checked={data.tiene_documento}>
            <div style={{ width:18, height:18, borderRadius:'var(--radius-full)', background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', position:'absolute', top:3,
              left: data.tiene_documento ? 23 : 3, transition:'left 180ms ease' }} />
          </div>
        </div>
      </div>

      {data.tiene_documento && (
        <div style={{ padding:'var(--space-5)' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)' }}>
            <div style={{ flex:'1 1 200px' }}>
              <div className="form-group">
                <label className="form-label">Número / Código</label>
                <input type="text" className="form-input" value={data.numero_documento_hv} placeholder="Ej: 12345-ABC"
                  onChange={e => onChange(doc.key, 'numero_documento_hv', e.target.value)} />
              </div>
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <div className="form-group">
                <label className="form-label">Fecha expedición</label>
                <input type="date" className="form-input" value={data.fecha_expedicion}
                  onChange={e => onChange(doc.key, 'fecha_expedicion', e.target.value)} />
              </div>
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <div className="form-group">
                <label className="form-label">Fecha vencimiento</label>
                <input type="date" className="form-input" value={data.fecha_vencimiento}
                  onChange={e => onChange(doc.key, 'fecha_vencimiento', e.target.value)} />
              </div>
            </div>
            <div style={{ flex:'1 1 220px' }}>
              <div className="form-group">
                <label className="form-label">Entidad que expide</label>
                <input type="text" className="form-input" value={data.entidad_expide} placeholder="Ej: Tribunal Ético de Medicina"
                  onChange={e => onChange(doc.key, 'entidad_expide', e.target.value)} />
              </div>
            </div>
            <div style={{ flex:'1 1 100%' }}>
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea className="form-textarea" rows={2} style={{ resize:'vertical', minHeight:60 }}
                  value={data.observaciones} placeholder="Notas adicionales..."
                  onChange={e => onChange(doc.key, 'observaciones', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sección colapsable especialidad ── */
function SeccionEspecialidad({ titulo, icono, subtitulo, open, onToggle, children, badgeVerif }) {
  const colorBadge = badgeVerif === 'SI' ? 'badge-vigente' : badgeVerif === 'PENDIENTE' ? 'badge-por-vencer' : 'badge-neutral';
  return (
    <div style={{ border:'1px solid rgba(197,198,210,0.4)', borderRadius:'var(--radius-xl)', overflow:'hidden',
      background: open ? 'white' : 'var(--color-surface-container-low)',
      boxShadow: open ? 'var(--shadow-sm)' : 'none', transition:'all 180ms ease' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'var(--space-4) var(--space-5)', cursor:'pointer',
        background: open ? 'rgba(26,78,215,0.04)' : 'transparent',
        borderBottom: open ? '1px solid rgba(197,198,210,0.25)' : 'none' }}
        onClick={onToggle} role="button" aria-expanded={open}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:'var(--radius-lg)', flexShrink:0,
            background: open ? 'rgba(26,78,215,0.08)' : 'var(--color-surface-container)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="material-symbols-outlined" style={{ color: open ? 'var(--color-secondary)' : '#94a3b8', fontSize:20 }}>{icono}</span>
          </div>
          <div>
            <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-primary)' }}>{titulo}</p>
            {subtitulo && <p style={{ fontSize:'0.6875rem', color:'#64748b', marginTop:1 }}>{subtitulo}</p>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {badgeVerif && (
            <span className={`badge ${colorBadge}`} style={{ fontSize:'0.6875rem' }}>
              {badgeVerif === 'SI' ? '✓ Verificado' : badgeVerif === 'PENDIENTE' ? 'Pendiente' : 'N/A'}
            </span>
          )}
          <span className="material-symbols-outlined sm" style={{ color:'#94a3b8', transition:'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>expand_more</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:'var(--space-5)' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)' }}>{children}</div>
        </div>
      )}
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════ */
export default function Tab3Especialidades({ medicoDoc, onNext, onPrev, markCompleted }) {
  const [data,      setData]      = useState(INIT);
  const [docs,      setDocs]      = useState(() => {
    const init = {};
    DOCS_HABILITACION.forEach(d => { init[d.key] = { ...INIT_DOC }; });
    return init;
  });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [existe,    setExiste]    = useState(false);
  const [openSec,   setOpenSec]   = useState({ titulo:true, esp1:false, subesp2:false, subesp3:false, otros:false, verif:false });

  const docsRef = useRef(docs);
  useEffect(() => { docsRef.current = docs; }, [docs]);

  /* ── Carga inicial ── */
  useEffect(() => {
    if (!medicoDoc) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [rDip, rHab] = await Promise.allSettled([
          axiosInstance.get(`/medicos/${medicoDoc}/diplomas-verificaciones/`),
          axiosInstance.get(`/medicos/${medicoDoc}/docs-habilitacion/`,  { skipToast: true }),
        ]);

        /* ── Diplomas ── */
        if (rDip.status === 'fulfilled' && rDip.value.data) {
          const d = rDip.value.data;
          setData(prev => ({ ...prev,
            cartasolicvericredenciales:          d.cartas_verificacion    ?? '',
            soporteverificaciontitulos:          d.soporte_verificacion   ?? '',
            fechaverificaciontitulos:            d.fecha_verificacion     ?? '',
            titulomedgeneralodontologo:          d.pregrado?.titulo       ?? '',
            actamedgeneralodontologo:            d.pregrado?.acta         ?? '',
            tituloprofesional:                   d.pregrado?.tituloprofesional ?? '',
            universidadtituloprofesional:        d.pregrado?.universidad  ?? '',
            paisuniversidadtituloprofesional:    d.pregrado?.pais         ?? '',
            actaconvalidacionprofesional:        d.pregrado?.convalidacion ?? '',
            verifporcredtituloprofesional:       d.pregrado?.verificado   ?? '',
            diplomaespecialidad1:                d.especialidad_1?.diploma    ?? '',
            actaespecialidad1:                   d.especialidad_1?.acta       ?? '',
            tituloesp1:                          d.especialidad_1?.titulo     ?? '',
            universidadespecialidad1:            d.especialidad_1?.universidad ?? '',
            paisuniversidadespecialidad1:        d.especialidad_1?.pais       ?? '',
            actaconvalidacionespecialidad1:      d.especialidad_1?.convalidacion ?? '',
            verifporcredespecialidad1:           d.especialidad_1?.verificado ?? '',
            diplomasubespecialidad2:             d.subespecialidad_2?.diploma    ?? '',
            actasubespecialidad2:                d.subespecialidad_2?.acta       ?? '',
            titulosubesp2:                       d.subespecialidad_2?.titulo     ?? '',
            universidadsubespecialidad2:         d.subespecialidad_2?.universidad ?? '',
            paisuniversidadsubespecialidad2:     d.subespecialidad_2?.pais       ?? '',
            actaconvalidacionsubespecialidad2:   d.subespecialidad_2?.convalidacion ?? '',
            verifporcredsubespecialidad2:        d.subespecialidad_2?.verificado ?? '',
            diplomasubespecialidad3:             d.subespecialidad_3?.diploma    ?? '',
            actasubespecialidad3:                d.subespecialidad_3?.acta       ?? '',
            titulosubesp3:                       d.subespecialidad_3?.titulo     ?? '',
            universidadsubespecialidad3:         d.subespecialidad_3?.universidad ?? '',
            paisuniversidadsubespecialidad3:     d.subespecialidad_3?.pais       ?? '',
            actaconvalidacionsubespecialidad3:   d.subespecialidad_3?.convalidacion ?? '',
            verifporcredsubespecialidad3:        d.subespecialidad_3?.verificado ?? '',
            diplomaotrasespecialidades:          d.otros_estudios?.diploma ?? '',
            detalleotrosestudiosformales:        d.otros_estudios?.detalle ?? '',
            verifporcredotrosestudios:           d.otros_estudios?.verificado ?? '',
            certentrenamavanzado:                d.certificaciones_entrenamientos ?? '',
            detalleotrosentrenamientosavanzados: d.otros_estudios?.detalle_entrenamiento ?? '',
          }));
          setExiste(true);
        }

        /* ── Hab docs — nueva tabla unificada ── */
        if (rHab.status === 'fulfilled' && rHab.value.data) {
          const dHab = rHab.value.data;
          setDocs(prev => {
            const n = { ...prev };
            DOCS_HABILITACION.forEach(doc => {
              const item = dHab[doc.key];
              if (item && item.codigo) {
                n[doc.key] = {
                  ...n[doc.key],
                  tiene_documento: true,
                  numero_documento_hv: item.codigo        || '',
                  fecha_expedicion:    item.fecha_expedicion  || '',
                  fecha_vencimiento:   item.fecha_vencimiento || '',
                  entidad_expide:      item.entidad_expide    || '',
                  observaciones:       item.observaciones     || '',
                };
              }
            });
            return n;
          });
        }

      } catch (e) {
        if (e.response?.status !== 404) console.error('Error cargando Tab3:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [medicoDoc]);

  /* ── Handlers ── */
  const handleChange  = (e) => { const { name, value } = e.target; setData(prev => ({ ...prev, [name]: value })); };
  const toggleSec     = (key) => setOpenSec(prev => ({ ...prev, [key]: !prev[key] }));
  const handleToggle  = (key) => setDocs(prev => ({ ...prev, [key]: { ...prev[key], tiene_documento: !prev[key].tiene_documento } }));
  const handleDocChange = (key, field, value) => setDocs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  /* ── Guardar ── */
  const handleNext = async () => {
    setSaving(true); setSaveError(null);
    try {
      const d    = data;
      const snap = docsRef.current;

      const diplomasPayload = {
        cartas_verificacion:    d.cartasolicvericredenciales || null,
        soporte_verificacion:   d.soporteverificaciontitulos || null,
        fecha_verificacion:     d.fechaverificaciontitulos   || null,
        pregrado: {
          titulo:          d.titulomedgeneralodontologo       || null,
          acta:            d.actamedgeneralodontologo         || null,
          tituloprofesional: d.tituloprofesional              || null,
          universidad:     d.universidadtituloprofesional     || null,
          pais:            d.paisuniversidadtituloprofesional || null,
          convalidacion:   d.actaconvalidacionprofesional     || null,
          verificado:      d.verifporcredtituloprofesional    || null,
          numero:          snap.diploma_pregrado?.numero_documento_hv || null,
          fecha_exp:       snap.diploma_pregrado?.fecha_expedicion    || null,
          entidad:         snap.diploma_pregrado?.entidad_expide      || null,
          observaciones:   snap.diploma_pregrado?.observaciones       || null,
        },
        especialidad_1: {
          diploma:         d.diplomaespecialidad1             || null,
          acta:            d.actaespecialidad1                || null,
          titulo:          d.tituloesp1                       || null,
          universidad:     d.universidadespecialidad1         || null,
          pais:            d.paisuniversidadespecialidad1     || null,
          convalidacion:   d.actaconvalidacionespecialidad1   || null,
          verificado:      d.verifporcredespecialidad1        || null,
          numero:          snap.certificado_especialidad?.numero_documento_hv || null,
          fecha_exp:       snap.certificado_especialidad?.fecha_expedicion    || null,
          entidad:         snap.certificado_especialidad?.entidad_expide      || null,
          observaciones:   snap.certificado_especialidad?.observaciones       || null,
        },
        subespecialidad_2: {
          diploma: d.diplomasubespecialidad2 || null, acta: d.actasubespecialidad2 || null,
          titulo: d.titulosubesp2 || null, universidad: d.universidadsubespecialidad2 || null,
          pais: d.paisuniversidadsubespecialidad2 || null,
          convalidacion: d.actaconvalidacionsubespecialidad2 || null,
          verificado: d.verifporcredsubespecialidad2 || null,
        },
        subespecialidad_3: {
          diploma: d.diplomasubespecialidad3 || null, acta: d.actasubespecialidad3 || null,
          titulo: d.titulosubesp3 || null, universidad: d.universidadsubespecialidad3 || null,
          pais: d.paisuniversidadsubespecialidad3 || null,
          convalidacion: d.actaconvalidacionsubespecialidad3 || null,
          verificado: d.verifporcredsubespecialidad3 || null,
        },
        otros_estudios: {
          diploma: d.diplomaotrasespecialidades || null, detalle: d.detalleotrosestudiosformales || null,
          verificado: d.verifporcredotrosestudios || null,
          detalle_entrenamiento: d.detalleotrosentrenamientosavanzados || null,
        },
        certificaciones_entrenamientos: d.certentrenamavanzado || null,
      };

      /* ── Docs habilitación — tabla unificada con JSON por documento ── */
      const docsHabPayload = {};
      DOCS_HABILITACION.forEach(doc => {
        const d = snap[doc.key];
        docsHabPayload[doc.key] = d.tiene_documento ? {
          codigo:            d.numero_documento_hv || null,
          fecha_expedicion:  d.fecha_expedicion    || null,
          fecha_vencimiento: d.fecha_vencimiento   || null,
          entidad_expide:    d.entidad_expide       || null,
          observaciones:     d.observaciones        || null,
        } : null;
      });

      await Promise.all([
        axiosInstance.put(`/medicos/${medicoDoc}/diplomas-verificaciones/`, diplomasPayload),
        axiosInstance.put(`/medicos/${medicoDoc}/docs-habilitacion/`,       docsHabPayload),
      ]);

      setExiste(true);
      markCompleted(3);
      onNext();
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al guardar.';
      setSaveError(Array.isArray(msg) ? msg.map(m => m.msg ?? JSON.stringify(m)).join(' · ') : msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Completitud visual ── */
  const camposLlenos = [data.tituloprofesional, data.universidadtituloprofesional, data.tituloesp1, data.universidadespecialidad1].filter(Boolean).length;
  const pctCompleto  = Math.round((camposLlenos / 4) * 100);
  const registrados  = Object.values(docs).filter(d => d.tiene_documento).length;
  const conAlerta    = Object.values(docs).filter(d => d.tiene_documento && d.fecha_vencimiento && diasParaVencer(d.fecha_vencimiento) <= 15).length;

  /* ── Skeleton ── */
  if (loading) return (
    <div style={{ padding: '3rem 2.5rem' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-xl)', marginBottom: 12 }} />
      ))}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 148px)' }}>
      <div style={{ flex:1, padding:'3rem 2.5rem', maxWidth:1620, margin:'0 auto', width:'100%' }}>

        <div style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'var(--color-primary)', letterSpacing:'-0.01em' }}>
            Académica y Habilitación
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:4 }}>
            Títulos, especialidades, verificación de credenciales y documentos de habilitación profesional.
          </p>
        </div>

        {saveError && (
          <div style={{ background:'rgba(186,26,26,0.08)', border:'1px solid rgba(186,26,26,0.3)', borderRadius:'var(--radius-xl)', padding:'var(--space-4) var(--space-5)', marginBottom:'var(--space-5)', display:'flex', gap:12 }} role="alert">
            <span className="material-symbols-outlined" style={{ color:'var(--color-error)', flexShrink:0 }}>error</span>
            <p style={{ fontSize:'0.875rem', color:'var(--color-error)', fontWeight:500 }}>{saveError}</p>
          </div>
        )}

        {/* ── Barra completitud académica ── */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:'var(--space-6)', padding:'var(--space-4) var(--space-5)', background:'rgba(26,78,215,0.04)', borderRadius:'var(--radius-xl)', border:'1px solid rgba(26,78,215,0.1)' }}>
          <span className="material-symbols-outlined" style={{ color:'var(--color-secondary)', flexShrink:0 }}>school</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-primary)' }}>Campos académicos clave</span>
              <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'var(--color-secondary)' }}>{pctCompleto}%</span>
            </div>
            <div style={{ height:5, borderRadius:'var(--radius-full)', background:'rgba(197,198,210,0.4)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pctCompleto}%`, background:'var(--color-secondary)', borderRadius:'var(--radius-full)', transition:'width 300ms ease' }} />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8 }}>
            <span className="material-symbols-outlined filled sm" style={{ color:'var(--color-secondary)' }}>fact_check</span>
            <span style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-primary)' }}>{registrados}/{DOCS_HABILITACION.length} docs</span>
            {conAlerta > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.8125rem', fontWeight:600, color:'var(--color-error)' }}>
                <span className="material-symbols-outlined sm">warning</span>{conAlerta} alerta
              </span>
            )}
          </div>
        </div>

        {/* ══ VERIFICACIÓN DE CREDENCIALES ══ */}
        <p className="form-section-title">Verificación de credenciales</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:'var(--space-6)', padding:'var(--space-5)', background:'white', border:'1px solid rgba(197,198,210,0.4)', borderRadius:'var(--radius-xl)', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ flex:'1 1 200px' }}>
            <CampoSelect label="Carta solicitud verificación" name="cartasolicvericredenciales" value={data.cartasolicvericredenciales} onChange={handleChange} options={OPT_VERIF} />
          </div>
          <div style={{ flex:'1 1 200px' }}>
            <CampoSelect label="Soporte verificación títulos" name="soporteverificaciontitulos" value={data.soporteverificaciontitulos} onChange={handleChange} options={OPT_VERIF} />
          </div>
          <div style={{ flex:'1 1 180px' }}>
            <Campo label="Fecha verificación" name="fechaverificaciontitulos" type="date" value={data.fechaverificaciontitulos} onChange={handleChange} />
          </div>
        </div>

        {/* ══ FORMACIÓN ACADÉMICA ══ */}
        <p className="form-section-title">Formación académica</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)', marginBottom:'var(--space-8)' }}>

          <SeccionEspecialidad titulo="Título Profesional" icono="menu_book"
            subtitulo={data.tituloprofesional || 'Sin título registrado'}
            open={openSec.titulo} onToggle={() => toggleSec('titulo')}
            badgeVerif={data.verifporcredtituloprofesional || null}>
            <div style={{ flex:'1 1 220px' }}><CampoSelect label="Título méd. general / odontólogo" name="titulomedgeneralodontologo" value={data.titulomedgeneralodontologo} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 180px' }}><Campo label="N.° Acta méd. general" name="actamedgeneralodontologo" value={data.actamedgeneralodontologo} onChange={handleChange} placeholder="Ej: ACT-2024-001" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Título profesional" name="tituloprofesional" value={data.tituloprofesional} onChange={handleChange} placeholder="Ej: Médico Cirujano" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Universidad" name="universidadtituloprofesional" value={data.universidadtituloprofesional} onChange={handleChange} placeholder="Ej: Universidad de Antioquia" /></div>
            <div style={{ flex:'1 1 180px' }}><Campo label="País universidad" name="paisuniversidadtituloprofesional" value={data.paisuniversidadtituloprofesional} onChange={handleChange} placeholder="Ej: Colombia" /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Acta convalidación" name="actaconvalidacionprofesional" value={data.actaconvalidacionprofesional} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación por credencial" name="verifporcredtituloprofesional" value={data.verifporcredtituloprofesional} onChange={handleChange} options={OPT_VERIF} /></div>
          </SeccionEspecialidad>

          <SeccionEspecialidad titulo="Especialidad 1" icono="local_hospital"
            subtitulo={data.tituloesp1 || 'Sin especialidad registrada'}
            open={openSec.esp1} onToggle={() => toggleSec('esp1')}
            badgeVerif={data.verifporcredespecialidad1 || null}>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Diploma especialidad" name="diplomaespecialidad1" value={data.diplomaespecialidad1} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 180px' }}><Campo label="N.° Acta especialidad" name="actaespecialidad1" value={data.actaespecialidad1} onChange={handleChange} placeholder="Ej: ACT-ESP-001" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Título especialidad" name="tituloesp1" value={data.tituloesp1} onChange={handleChange} placeholder="Ej: Anestesiología" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Universidad" name="universidadespecialidad1" value={data.universidadespecialidad1} onChange={handleChange} placeholder="Ej: Pontificia Universidad Javeriana" /></div>
            <div style={{ flex:'1 1 160px' }}><Campo label="País universidad" name="paisuniversidadespecialidad1" value={data.paisuniversidadespecialidad1} onChange={handleChange} placeholder="Ej: Colombia" /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Acta convalidación" name="actaconvalidacionespecialidad1" value={data.actaconvalidacionespecialidad1} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación por credencial" name="verifporcredespecialidad1" value={data.verifporcredespecialidad1} onChange={handleChange} options={OPT_VERIF} /></div>
          </SeccionEspecialidad>

          <SeccionEspecialidad titulo="Subespecialidad 2" icono="biotech"
            subtitulo={data.titulosubesp2 || 'Sin subespecialidad registrada'}
            open={openSec.subesp2} onToggle={() => toggleSec('subesp2')}
            badgeVerif={data.verifporcredsubespecialidad2 || null}>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Diploma subespecialidad" name="diplomasubespecialidad2" value={data.diplomasubespecialidad2} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 180px' }}><Campo label="N.° Acta" name="actasubespecialidad2" value={data.actasubespecialidad2} onChange={handleChange} placeholder="Ej: ACT-SUB2-001" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Título subespecialidad" name="titulosubesp2" value={data.titulosubesp2} onChange={handleChange} placeholder="Ej: Dolor y Cuidado Paliativo" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Universidad" name="universidadsubespecialidad2" value={data.universidadsubespecialidad2} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 160px' }}><Campo label="País universidad" name="paisuniversidadsubespecialidad2" value={data.paisuniversidadsubespecialidad2} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Acta convalidación" name="actaconvalidacionsubespecialidad2" value={data.actaconvalidacionsubespecialidad2} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación por credencial" name="verifporcredsubespecialidad2" value={data.verifporcredsubespecialidad2} onChange={handleChange} options={OPT_VERIF} /></div>
          </SeccionEspecialidad>

          <SeccionEspecialidad titulo="Subespecialidad 3" icono="science"
            subtitulo={data.titulosubesp3 || 'Sin subespecialidad registrada'}
            open={openSec.subesp3} onToggle={() => toggleSec('subesp3')}
            badgeVerif={data.verifporcredsubespecialidad3 || null}>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Diploma subespecialidad" name="diplomasubespecialidad3" value={data.diplomasubespecialidad3} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 180px' }}><Campo label="N.° Acta" name="actasubespecialidad3" value={data.actasubespecialidad3} onChange={handleChange} placeholder="Ej: ACT-SUB3-001" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Título subespecialidad" name="titulosubesp3" value={data.titulosubesp3} onChange={handleChange} placeholder="Ej: Neuroanestesia" /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Universidad" name="universidadsubespecialidad3" value={data.universidadsubespecialidad3} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 160px' }}><Campo label="País universidad" name="paisuniversidadsubespecialidad3" value={data.paisuniversidadsubespecialidad3} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Acta convalidación" name="actaconvalidacionsubespecialidad3" value={data.actaconvalidacionsubespecialidad3} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación por credencial" name="verifporcredsubespecialidad3" value={data.verifporcredsubespecialidad3} onChange={handleChange} options={OPT_VERIF} /></div>
          </SeccionEspecialidad>

          <SeccionEspecialidad titulo="Otros estudios y entrenamientos avanzados" icono="emoji_events"
            subtitulo={data.detalleotrosestudiosformales || 'Sin otros estudios registrados'}
            open={openSec.otros} onToggle={() => toggleSec('otros')}
            badgeVerif={data.verifporcredotrosestudios || null}>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Diploma otros estudios" name="diplomaotrasespecialidades" value={data.diplomaotrasespecialidades} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 100%' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="detalleotrosestudiosformales">Detalle otros estudios formales</label>
                <textarea id="detalleotrosestudiosformales" name="detalleotrosestudiosformales" className="form-textarea" rows={2} style={{ resize:'vertical', minHeight:60 }}
                  value={data.detalleotrosestudiosformales} placeholder="Maestrías, diplomaturas, fellowships..." onChange={handleChange} />
              </div>
            </div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación otros estudios" name="verifporcredotrosestudios" value={data.verifporcredotrosestudios} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Cert. entrenamiento avanzado" name="certentrenamavanzado" value={data.certentrenamavanzado} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 100%' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="detalleotrosentrenamientosavanzados">Detalle entrenamientos avanzados</label>
                <textarea id="detalleotrosentrenamientosavanzados" name="detalleotrosentrenamientosavanzados" className="form-textarea" rows={2} style={{ resize:'vertical', minHeight:60 }}
                  value={data.detalleotrosentrenamientosavanzados} placeholder="Simulación clínica, entrenamientos de alta fidelidad..." onChange={handleChange} />
              </div>
            </div>
          </SeccionEspecialidad>
        </div>

        {/* ══ DOCUMENTOS DE HABILITACIÓN ══ */}
        <p className="form-section-title">Documentos de habilitación</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)', marginBottom:'var(--space-8)' }}>
          {DOCS_HABILITACION.map(doc => (
            <DocPanel key={doc.key} doc={doc} data={docs[doc.key]}
              onChange={handleDocChange} onToggle={handleToggle} />
          ))}
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={onPrev} disabled={saving}>
          <span className="material-symbols-outlined sm">arrow_back</span>
          HV y Prerrogativas
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, minHeight:'inherit' }}>
          {saving && (
            <span style={{ fontSize:'0.8125rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:6 }}>
              <span className="material-symbols-outlined sm" style={{ animation:'spin 1s linear infinite' }}>progress_activity</span>
              Guardando…
            </span>
          )}
          <button className="btn btn-signature" onClick={handleNext} disabled={saving}>
            Guardar y continuar
            <span className="material-symbols-outlined sm">arrow_forward</span>
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}