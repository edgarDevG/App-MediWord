import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import FileUploadField from '../../components/shared/FileUploadField';

/* ══════════════════════════════════════════════════════════════
   Tab3 v2: Académica y Habilitación
   CAMBIOS v2:
   - 3A: Adjunto soporte verificación (max 1) tras campo soporteverificaciontitulos
   - 3B: Adjunto soporte en Pregrado y Especialidades cuando verificado = SI
   - 3C: Adjunto soporte en Otros Estudios cuando verifporcredotrosestudios = SI (max 5)
   Carpeta: diplomas_verificaciones
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

const OPT_TITULO_PREGRADO = [
  { value: 'MEDICO_GENERAL', label: 'Médico General' },
  { value: 'ODONTOLOGO',     label: 'Odontólogo' },
];

const INIT = {
  cartasolicvericredenciales: '', soporteverificaciontitulos: '', fechaverificaciontitulos: '',
  titulomedgeneralodontologo: '', actamedgeneralodontologo: '', tituloprofesional: '',
  universidadtituloprofesional: '', paisuniversidadtituloprofesional: '',
  actaconvalidacionprofesional: '', verifporcredtituloprofesional: '',
  diplomaotrasespecialidades: '', detalleotrosestudiosformales: '',
  verifporcredotrosestudios: '', certentrenamavanzado: '',
  detalleotrosentrenamientosavanzados: '',
};

const INIT_ESPECIALIDAD = {
  diploma: '', acta: '', titulo: '', universidad: '', pais: '', convalidacion: '', verificado: ''
};

/* ── Habilitación docs ── */
// ELIMINADOS: certificado_especialidad, diploma_pregrado, antecedentes_judiciales
const DOCS_HABILITACION = [
  { key: 'rethus',                      label: 'Tarjeta RETHUS',                      icon: 'verified',            required: true  },
  { key: 'examen_medico',               label: 'Examen Médico Ocupacional',           icon: 'medical_information', required: true  },
  { key: 'antecedentes_disciplinarios', label: 'Cert. Antecedentes Disciplinarios',   icon: 'gavel',               required: false },
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
function DocPanel({ doc, data, onChange, onToggle, medicoDoc }) {
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
              {doc.key !== 'rethus' && (
                <div className="form-group">
                  <label className="form-label">Fecha vencimiento</label>
                  <input type="date" className="form-input" value={data.fecha_vencimiento}
                    onChange={e => onChange(doc.key, 'fecha_vencimiento', e.target.value)} />
                </div>
              )}
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
          {/* Adjunto por documento de habilitación */}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <FileUploadField
              carpeta="diplomas_verificaciones"
              maxArchivos={2}
              medicoDoc={medicoDoc}
              campoRef={doc.key}
              compact
              label={`Adjuntar ${doc.label}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionEspecialidad({ titulo, icono, subtitulo, open, onToggle, badgeVerif, onDelete, children }) {
  return (
    <div style={{ border: '1px solid rgba(197,198,210,0.4)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'white' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f8fafc', cursor: 'pointer', borderBottom: open ? '1px solid rgba(197,198,210,0.4)' : 'none' }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(14, 155, 138, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0E9B8A' }}>{icono}</span>
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>{titulo}</h4>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{subtitulo}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {badgeVerif === 'SI' && <span className="badge badge-vigente"><span className="material-symbols-outlined sm">check</span> VERIFICADO</span>}
          
          {onDelete && (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              title="Eliminar Subespecialidad"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
            </button>
          )}

          <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 4. COMPONENTE PRINCIPAL ── */
export default function Tab3Especialidades({ onPrev, onNext, medicoDoc, markCompleted, setExiste }) {
  const [data, setData] = useState(INIT);
  const [docs, setDocs] = useState(() => {
    const d = {}; DOCS_HABILITACION.forEach(doc => d[doc.key] = { ...INIT_DOC }); return d;
  });
  
  const [especialidades, setEspecialidades] = useState([{ ...INIT_ESPECIALIDAD }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  const [openSec, setOpenSec] = useState({ pregrado: true, otros: false });
  const [openSpecs, setOpenSpecs] = useState([false, false, false]); 

  const docsRef = useRef(docs);
  useEffect(() => { docsRef.current = docs; }, [docs]);

  /* ── Carga Inicial ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [resDiplomas, resDocs] = await Promise.all([
          axiosInstance.get(`/medicos/${medicoDoc}/diplomas-verificaciones/`),
          axiosInstance.get(`/medicos/${medicoDoc}/docs-habilitacion/`)
        ]);
        
        const d = resDiplomas.data;
        
        setData({
          ...INIT,
          cartasolicvericredenciales: d.cartas_verificacion || '',
          soporteverificaciontitulos: d.soporte_verificacion || '',
          fechaverificaciontitulos: d.fecha_verificacion || '',
          titulomedgeneralodontologo: d.pregrado?.titulo || '',
          actamedgeneralodontologo: d.pregrado?.acta || '',
          tituloprofesional: d.pregrado?.tituloprofesional || '',
          universidadtituloprofesional: d.pregrado?.universidad || '',
          paisuniversidadtituloprofesional: d.pregrado?.pais || '',
          actaconvalidacionprofesional: d.pregrado?.convalidacion || '',
          verifporcredtituloprofesional: d.pregrado?.verificado || '',
          diplomaotrasespecialidades: d.otros_estudios?.diploma || '',
          detalleotrosestudiosformales: d.otros_estudios?.detalle || '',
          verifporcredotrosestudios: d.otros_estudios?.verificado || '',
          detalleotrosentrenamientosavanzados: d.otros_estudios?.detalle_entrenamiento || '',
          certentrenamavanzado: d.certificiones_entrenamientos || '',
        });

        const specsCargadas = [];
        if (d.especialidad_1 && Object.keys(d.especialidad_1).length > 0) specsCargadas.push(d.especialidad_1);
        if (d.subespecialidad_2 && Object.keys(d.subespecialidad_2).length > 0) specsCargadas.push(d.subespecialidad_2);
        if (d.subespecialidad_3 && Object.keys(d.subespecialidad_3).length > 0) specsCargadas.push(d.subespecialidad_3);
        
        setEspecialidades(specsCargadas.length > 0 ? specsCargadas : [{ ...INIT_ESPECIALIDAD }]);

        if (resDocs.data) {
          const dHab = {};
          DOCS_HABILITACION.forEach(doc => {
            const dbD = resDocs.data[doc.key];
            dHab[doc.key] = dbD ? {
              tiene_documento: true,
              numero_documento_hv: dbD.codigo || '',
              fecha_expedicion: dbD.fecha_expedicion || '',
              fecha_vencimiento: dbD.fecha_vencimiento || '',
              entidad_expide: dbD.entidad_expide || '',
              observaciones: dbD.observaciones || ''
            } : { ...INIT_DOC };
          });
          setDocs(dHab);
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

  const handleEspecialidadChange = (index, field, value) => {
    const nuevasSpecs = [...especialidades];
    nuevasSpecs[index] = { ...nuevasSpecs[index], [field]: value };
    setEspecialidades(nuevasSpecs);
  };

  const agregarEspecialidad = () => {
    if (especialidades.length < 3) {
      setEspecialidades([...especialidades, { ...INIT_ESPECIALIDAD }]);
      const newOpenSpecs = [...openSpecs];
      newOpenSpecs[especialidades.length] = true;
      setOpenSpecs(newOpenSpecs);
    }
  };

  const eliminarEspecialidad = (index) => {
    const nuevasSpecs = especialidades.filter((_, i) => i !== index);
    setEspecialidades(nuevasSpecs);
    const newOpenSpecs = openSpecs.filter((_, i) => i !== index);
    setOpenSpecs(newOpenSpecs);
  };

  const toggleSpec = (index) => {
    const newOpenSpecs = [...openSpecs];
    newOpenSpecs[index] = !newOpenSpecs[index];
    setOpenSpecs(newOpenSpecs);
  };

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
        especialidad_1: especialidades[0] ? {
          ...especialidades[0],
          numero:          snap.certificado_especialidad?.numero_documento_hv || null,
          fecha_exp:       snap.certificado_especialidad?.fecha_expedicion    || null,
          entidad:         snap.certificado_especialidad?.entidad_expide      || null,
          observaciones:   snap.certificado_especialidad?.observaciones       || null,
        } : null,
        subespecialidad_2: especialidades[1] || null,
        subespecialidad_3: especialidades[2] || null,
        otros_estudios: {
          diploma: d.diplomaotrasespecialidades || null, detalle: d.detalleotrosestudiosformales || null,
          verificado: d.verifporcredotrosestudios || null,
          detalle_entrenamiento: d.detalleotrosentrenamientosavanzados || null,
        },
        certificaciones_entrenamientos: d.certentrenamavanzado || null,
      };

      const docsHabPayload = {};
      DOCS_HABILITACION.forEach(doc => {
        const docSnap = snap[doc.key];
        docsHabPayload[doc.key] = docSnap.tiene_documento ? {
          codigo:            docSnap.numero_documento_hv || null,
          fecha_expedicion:  docSnap.fecha_expedicion    || null,
          fecha_vencimiento: doc.key === 'rethus' ? null : (docSnap.fecha_vencimiento || null),
          entidad_expide:    docSnap.entidad_expide       || null,
          observaciones:     docSnap.observaciones        || null,
        } : null;
      });

      await Promise.all([
        axiosInstance.put(`/medicos/${medicoDoc}/diplomas-verificaciones/`, diplomasPayload),
        axiosInstance.put(`/medicos/${medicoDoc}/docs-habilitacion/`,       docsHabPayload),
      ]);

      if(setExiste) setExiste(true);
      if(markCompleted) markCompleted(3);
      onNext();
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al guardar.';
      setSaveError(Array.isArray(msg) ? msg.map(m => m.msg ?? JSON.stringify(m)).join(' · ') : msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Completitud visual ── */
  const camposLlenos = [data.tituloprofesional, data.universidadtituloprofesional, especialidades[0]?.titulo, especialidades[0]?.universidad].filter(Boolean).length;
  const pctCompleto  = Math.round((camposLlenos / 4) * 100);
  const registrados  = Object.values(docs).filter(d => d.tiene_documento).length;
  const conAlerta    = Object.values(docs).filter(d => d.tiene_documento && d.fecha_vencimiento && diasParaVencer(d.fecha_vencimiento) <= 15).length;

  if (loading) return (
    <div style={{ padding: '3rem 2.5rem' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-xl)', marginBottom: 12, background: '#e2e8f0' }} />
      ))}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 148px)' }}>
      <div style={{ flex:1, padding:'3rem 2.5rem', maxWidth:1620, margin:'0 auto', width:'100%' }}>

        <div style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'var(--color-primary)', letterSpacing:'-0.01em' }}>
            Información Académica
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:4 }}>
            Títulos, especialidades, verificación de credenciales y documentos de habilitación profesional.
          </p>
        </div>

        <div style={{ background:'var(--color-surface-container-lowest)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)', padding:'var(--space-4) var(--space-5)', marginBottom:'var(--space-8)', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--color-primary)' }}>
              <span className="material-symbols-outlined sm">school</span>
              <p style={{ fontSize:'0.875rem', fontWeight:600, margin:0 }}>Campos académicos clave</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'var(--color-primary)' }}>{pctCompleto}%</span>
              <div style={{ width:1, height:16, background:'var(--color-border)' }} />
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.8125rem', fontWeight:600, color:'var(--color-secondary)' }}>
                <span className="material-symbols-outlined sm" style={{ fontSize:16 }}>fact_check</span>
                {registrados}/{DOCS_HABILITACION.length} docs
              </div>
              {conAlerta > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.8125rem', fontWeight:600, color:'var(--color-error)' }}>
                  <span className="material-symbols-outlined sm" style={{ fontSize:16 }}>warning</span>
                  {conAlerta} alerta{conAlerta !== 1 && 's'}
                </div>
              )}
            </div>
          </div>
          <div style={{ height:6, background:'var(--color-surface-container-high)', borderRadius:'var(--radius-full)', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'var(--color-secondary)', width:`${pctCompleto}%`, borderRadius:'var(--radius-full)', transition:'width 0.3s ease' }} />
          </div>
        </div>

        {saveError && (
          <div style={{ background:'rgba(186,26,26,0.08)', border:'1px solid rgba(186,26,26,0.3)', borderRadius:'var(--radius-xl)', padding:'var(--space-4) var(--space-5)', marginBottom:'var(--space-5)', display:'flex', gap:12 }} role="alert">
            <span className="material-symbols-outlined" style={{ color:'var(--color-error)', flexShrink:0 }}>error</span>
            <p style={{ fontSize:'0.875rem', color:'var(--color-error)', fontWeight:500 }}>{saveError}</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-6)', marginBottom:'var(--space-8)' }}>
          
          <p className="form-section-title">VERIFICACIÓN DE CREDENCIALES</p>
          <div style={{ display:'flex', gap:'var(--space-5)', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 240px' }}><CampoSelect label="Cartas solicitando verificación" name="cartasolicvericredenciales" value={data.cartasolicvericredenciales} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 240px' }}><CampoSelect label="Soporte de verificación" name="soporteverificaciontitulos" value={data.soporteverificaciontitulos} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><Campo label="Fecha verificación títulos" name="fechaverificaciontitulos" type="date" value={data.fechaverificaciontitulos} onChange={handleChange} /></div>
          </div>
          {/* 3A: Adjunto soporte verificación */}
          <div style={{ marginTop:'var(--space-4)' }}>
            <FileUploadField
              carpeta="diplomas_verificaciones"
              maxArchivos={1}
              medicoDoc={medicoDoc}
              campoRef="soporteverificaciontitulos"
              label="Adjuntar soporte de verificación"
            />
          </div>

          <SeccionEspecialidad titulo="Pregrado" icono="school"
            subtitulo={data.tituloprofesional || 'Información de pregrado'}
            open={openSec.pregrado} onToggle={() => toggleSec('pregrado')}
            badgeVerif={data.verifporcredtituloprofesional || null}>
            <div style={{ flex:'1 1 200px' }}>
              <CampoSelect 
                label="Título médico general/odontólogo" 
                name="titulomedgeneralodontologo" 
                value={data.titulomedgeneralodontologo} 
                onChange={handleChange} 
                options={OPT_TITULO_PREGRADO} 
              />
            </div>
            <div style={{ flex:'1 1 180px' }}><Campo label="Acta médico general/odontólogo" name="actamedgeneralodontologo" value={data.actamedgeneralodontologo} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Título profesional" name="tituloprofesional" value={data.tituloprofesional} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 220px' }}><Campo label="Universidad título profesional" name="universidadtituloprofesional" value={data.universidadtituloprofesional} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 160px' }}><Campo label="País universidad" name="paisuniversidadtituloprofesional" value={data.paisuniversidadtituloprofesional} onChange={handleChange} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Acta convalidación" name="actaconvalidacionprofesional" value={data.actaconvalidacionprofesional} onChange={handleChange} options={OPT_VERIF} /></div>
            <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación por credencial" name="verifporcredtituloprofesional" value={data.verifporcredtituloprofesional} onChange={handleChange} options={OPT_VERIF} /></div>
            {/* 3B: adjunto pregrado */}
            {data.verifporcredtituloprofesional === 'SI' && (
              <div style={{ flex:'1 1 100%', marginTop: 4 }}>
                <FileUploadField
                  carpeta="diplomas_verificaciones"
                  maxArchivos={1}
                  medicoDoc={medicoDoc}
                  campoRef="verifporcredtituloprofesional"
                  label="Soporte verificación pregrado"
                />
              </div>
            )}
          </SeccionEspecialidad>

          {especialidades.map((esp, index) => (
            <SeccionEspecialidad 
              key={index} 
              titulo={index === 0 ? "Especialidad 1" : `Subespecialidad ${index + 1}`} 
              icono={index === 0 ? "workspace_premium" : "biotech"} 
              subtitulo={esp.titulo || 'Sin especialidad registrada'}
              open={openSpecs[index]}
              onToggle={() => toggleSpec(index)} 
              badgeVerif={esp.verificado || null}
              onDelete={index > 0 ? () => eliminarEspecialidad(index) : null}
            >
              <div style={{ flex:'1 1 200px' }}><CampoSelect label="Diploma especialidad" name={`diploma-${index}`} value={esp.diploma} onChange={(e) => handleEspecialidadChange(index, 'diploma', e.target.value)} options={OPT_VERIF} /></div>
              <div style={{ flex:'1 1 180px' }}><Campo label="N.° Acta" name={`acta-${index}`} value={esp.acta} onChange={(e) => handleEspecialidadChange(index, 'acta', e.target.value)} placeholder="Ej: 855854444" /></div>
              <div style={{ flex:'1 1 220px' }}><Campo label="Título especialidad" name={`titulo-${index}`} value={esp.titulo} onChange={(e) => handleEspecialidadChange(index, 'titulo', e.target.value)} placeholder="Ej: Oncología Pediátrica" /></div>
              <div style={{ flex:'1 1 220px' }}><Campo label="Universidad" name={`universidad-${index}`} value={esp.universidad} onChange={(e) => handleEspecialidadChange(index, 'universidad', e.target.value)} /></div>
              <div style={{ flex:'1 1 160px' }}><Campo label="País universidad" name={`pais-${index}`} value={esp.pais} onChange={(e) => handleEspecialidadChange(index, 'pais', e.target.value)} /></div>
              <div style={{ flex:'1 1 200px' }}><CampoSelect label="Acta convalidación" name={`convalidacion-${index}`} value={esp.convalidacion} onChange={(e) => handleEspecialidadChange(index, 'convalidacion', e.target.value)} options={OPT_VERIF} /></div>
              <div style={{ flex:'1 1 200px' }}><CampoSelect label="Verificación por credencial" name={`verificado-${index}`} value={esp.verificado} onChange={(e) => handleEspecialidadChange(index, 'verificado', e.target.value)} options={OPT_VERIF} /></div>
              {/* 3B: adjunto especialidad */}
              {esp.verificado === 'SI' && (
                <div style={{ flex:'1 1 100%', marginTop: 4 }}>
                  <FileUploadField
                    carpeta="diplomas_verificaciones"
                    maxArchivos={1}
                    medicoDoc={medicoDoc}
                    campoRef={`especialidad_${index}_verificado`}
                    label="Soporte verificación especialidad"
                  />
                </div>
              )}
            </SeccionEspecialidad>
          ))}

          {especialidades.length < 3 && (
            <button type="button" onClick={agregarEspecialidad}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', background: 'white', border: '1px dashed #0E9B8A', color: '#0E9B8A', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <span className="material-symbols-outlined">add</span> Añadir otra especialidad / subespecialidad
            </button>
          )}

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
            {/* 3C: adjunto otros estudios */}
            {data.verifporcredotrosestudios === 'SI' && (
              <div style={{ flex:'1 1 100%', marginTop: 4 }}>
                <FileUploadField
                  carpeta="diplomas_verificaciones"
                  maxArchivos={5}
                  medicoDoc={medicoDoc}
                  campoRef="verifporcredotrosestudios"
                  label="Soportes verificación otros estudios (máx. 5)"
                />
              </div>
            )}
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
              onChange={handleDocChange} onToggle={handleToggle} medicoDoc={medicoDoc} />
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
