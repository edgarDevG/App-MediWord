import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../components/Toast';
import './FormFSFB.css';

/* ── Opciones ── */
const OPT_SNA  = [{ value:'SI', label:'Sí' }, { value:'NO', label:'No' }, { value:'N/A', label:'N/A' }];
const OPT_EST  = [{ value:'VIGENTE', label:'Vigente' }, { value:'VENCIDO', label:'Vencido' }, { value:'PENDIENTE', label:'Pendiente' }, { value:'N/A', label:'N/A' }];
const OPT_TIPO_DOC = [{ value:'CC', label:'Cédula de Ciudadanía' }, { value:'CE', label:'C.E.' }, { value:'PA', label:'Pasaporte' }, { value:'PEP', label:'PEP' }];
const OPT_SEXO = [{ value:'M', label:'Masculino' }, { value:'F', label:'Femenino' }, { value:'O', label:'Otro' }];
const OPT_VIN  = [
  { value:'Contrato laboral',     label:'Contrato laboral'     },
  { value:'Prestación servicios', label:'Prestación servicios' },
  { value:'FSFB',                 label:'FSFB'                 },
];
const OPT_LUGAR_NAC = [
  { value:'Bogotá', label:'Bogotá' },
  { value:'Medellín', label:'Medellín' },
  { value:'Cali', label:'Cali' },
  { value:'Barranquilla', label:'Barranquilla' },
  { value:'Cartagena', label:'Cartagena' },
  { value:'Extrangero', label:'Extrangero' },
  { value:'Otro', label:'Otro' },
];
const OPT_EST_CIVIL = [
  { value:'Soltero/a', label:'Soltero/a' },
  { value:'Casado/a', label:'Casado/a' },
  { value:'Unión libre', label:'Unión libre' },
  { value:'Divorciado/a', label:'Divorciado/a' },
  { value:'Viudo/a', label:'Viudo/a' },
];
const IDIOMAS_OPCIONES = ['Inglés', 'Francés', 'Italiano', 'Alemán', 'Portugués'];

const CURSOS = [
  { label:'BLS',             fecha:'bls_fecha_venc',        estado:'bls_estado',            icon:'favorite'           },
  { label:'ACLS',            fecha:'acls_fecha_venc',       estado:'acls_estado',           icon:'monitor_heart'      },
  { label:'PALS',            fecha:'pals_fecha_venc',       estado:'pals_estado',           icon:'child_care'         },
  { label:'NALS',            fecha:'nals_fecha_venc',       estado:'nals_estado',           icon:'baby_changing_station'},
  { label:'Radioprotección', fecha:'radioproteccion_fecha', estado:'radioproteccion_estado',icon:'radar'              },
  { label:'Violencia Sexual',fecha:'violencia_sexual_fecha',estado:'violencia_sexual_estado',icon:'shield_person'      },
  { label:'Ag. Químicos',    fecha:'ataques_quimicos_fecha',estado:'ataques_quimicos_estado',icon:'science'             },
  { label:'Dengue',          fecha:'dengue_fecha',          estado:'dengue_estado',         icon:'bug_report'         },
  { label:'AIEPI',           fecha:'aiepi_fecha',           estado:'aiepi_estado',          icon:'medical_services'   },
  { label:'Sedación',        fecha:'sedacion_fecha',        estado:'sedacion_estado',       icon:'medication'         },
  { label:'Manejo Dolor',    fecha:'manejo_dolor_fecha',    estado:'manejo_dolor_estado',   icon:'healing'            },
  { label:'Gest. Donante',   fecha:'gestion_donante_fecha', estado:'gestion_donante_estado',icon:'volunteer_activism' },
  { label:'Gest. Duelo',     fecha:'gestion_duelo_fecha',   estado:'gestion_duelo_estado',  icon:'sentiment_sad'      },
  { label:'IAMII',           fecha:'iamii_fecha',           estado:'iamii_estado',          icon:'cardiology'         },
  { label:'Telemedicina',    fecha:'telemedicina_fecha',    estado:'telemedicina_estado',   icon:'videocam'           },
];

const ESTADO_META = {
  'OK':        { cls:'badge-success', icon:'check_circle'  },
  'Por vencer':{ cls:'badge-warning', icon:'schedule'      },
  'Vencido':   { cls:'badge-error',   icon:'cancel'        },
  'VIGENTE':   { cls:'badge-success', icon:'check_circle'  },
  'VENCIDO':   { cls:'badge-error',   icon:'cancel'        },
  'PENDIENTE': { cls:'badge-warning', icon:'pending'       },
  'N/A':       { cls:'badge-neutral', icon:'remove_circle' },
};

const toDate = (v) => (!v ? '' : String(v).slice(0, 10));

const INIT_MED  = { primer_nombre:'', segundo_nombre:'', primer_apellido:'', segundo_apellido:'', categoria:'', especialidad:'', anios_cuerpo_medico:'' };
const INIT_CONT = { correo:'', celular:'', telefono:'', direccion_correspondencia:'', direccion_consultorio:'', tipo_documento:'', lugar_expedicion:'', fecha_nacimiento:'', lugar_nacimiento:'', sexo:'', estado_civil:'', tiene_hijos:'', maneja_lengua_senas:false, idiomas_seleccionados:[], idioma_otro:'' };
const INIT_VIN  = { tipo_vinculacion:'', estado_contrato:'', modalidad_honorarios:'', tiempo_laborado:'' };
const INIT_ACC  = { induccion_medica_fsfb:'', induccion_medica_chsm:'', induccion_general_chsm:'', induccion_his_isis:'', perfil_cargo:'', entrenamiento:'', estado_codigo:'', codigo_smm:'', estado_carnet:'', tarjeta_acceso:'', estado_bata:'', entrega_almera:'', entrega_ruaf:'', mipres:'', correo_corporativo:'', radio_expuesto:'', carta_turnos:'', poliza_resp_civil:'', fecha_venc_poliza:'', poliza_complicaciones:'' };
const INIT_NORM = { ...Object.fromEntries(CURSOS.flatMap(c => [[c.fecha,''], [c.estado,'']])), cursos_3_anios:'' };

const TABS = [
  { label: 'Datos Personales',       icon: 'person' },
  { label: 'Contratación y Accesos', icon: 'local_hospital' },
  { label: 'Normatividad',           icon: 'gavel' }
];

/* ══════════════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════════════ */

function Campo({ label, name, type = 'text', value, onChange, error, required, disabled, placeholder, span }) {
  return (
    <div className="form-group fm-field" style={span ? { gridColumn: `span ${span}` } : {}}>
      <label className="form-label" htmlFor={name}>
        {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 3 }}>*</span>}
      </label>
      <input
        id={name} name={name} type={type}
        className={`form-input fm-input${error ? ' error' : ''}`}
        value={value ?? ''} onChange={onChange} disabled={disabled}
        placeholder={placeholder}
      />
      {error && (
        <span className="fm-error">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          {error}
        </span>
      )}
    </div>
  );
}

function CampoSelect({ label, name, value, onChange, options = [], placeholder, required, disabled, span, error }) {
  return (
    <div className="form-group fm-field" style={span ? { gridColumn: `span ${span}` } : {}}>
      <label className="form-label" htmlFor={name}>
        {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: 3 }}>*</span>}
      </label>
      <div className="fm-select-wrap">
        <select
          id={name} name={name}
          className={`form-select fm-select${error ? ' error' : ''}`}
          value={value ?? ''} onChange={onChange} disabled={disabled}
        >
          <option value="">{placeholder ?? 'Seleccionar…'}</option>
          {options.map((o, idx) => (
            <option key={idx} value={o.value || o}>{o.label || o}</option>
          ))}
        </select>
        <span className="material-symbols-outlined fm-select-arrow">expand_more</span>
      </div>
      {error && (
        <span className="fm-error">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          {error}
        </span>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="fm-section-card">
      <div className="fm-section-header">
        <span className="material-symbols-outlined fm-section-icon">{icon}</span>
        <span className="fm-section-title">{title}</span>
        <div className="fm-section-line"></div>
      </div>
      <div className="fm-section-body">
        {children}
      </div>
    </div>
  );
}

function SubLabel({ children }) {
  return (
    <p style={{
      fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      marginBottom: '1rem', marginTop: '0.25rem',
    }}>
      {children}
    </p>
  );
}

/* ── Toggle Switch ── */
function ToggleSwitch({ label, checked, onChange, span }) {
  return (
    <div className="form-group fm-field" style={span ? { gridColumn: `span ${span}` } : {}}>
      <label className="form-label">{label}</label>
      <div
        onClick={() => onChange(!checked)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', userSelect: 'none',
          background: checked ? 'var(--color-primary, #0A5C99)' : '#e2e8f0',
          borderRadius: '9999px',
          padding: '4px 12px 4px 4px',
          width: 'fit-content',
          transition: 'background 200ms',
          height: '36px',
        }}
      >
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transition: 'transform 200ms',
        }} />
        <span style={{
          fontSize: '0.8125rem', fontWeight: 600,
          color: checked ? '#fff' : '#475569',
        }}>
          {checked ? 'Sí' : 'No'}
        </span>
      </div>
    </div>
  );
}

/* ── Chips de idiomas ── */
function IdiomasChips({ seleccionados, onChange, span = 4 }) {
  const toggle = (idioma) => {
    const next = seleccionados.includes(idioma)
      ? seleccionados.filter(i => i !== idioma)
      : [...seleccionados, idioma];
    onChange(next);
  };
  return (
    <div className="form-group fm-field" style={{ gridColumn: `span ${span}` }}>
      <label className="form-label">IDIOMAS QUE MANEJA</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
        {IDIOMAS_OPCIONES.map(idioma => {
          const activo = seleccionados.includes(idioma);
          return (
            <button
              key={idioma}
              type="button"
              onClick={() => toggle(idioma)}
              style={{
                padding: '5px 14px',
                borderRadius: '9999px',
                border: `1.5px solid ${activo ? 'var(--color-primary, #0A5C99)' : '#cbd5e1'}`,
                background: activo ? 'var(--color-primary, #0A5C99)' : '#fff',
                color: activo ? '#fff' : '#475569',
                fontSize: '0.8125rem',
                fontWeight: activo ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 160ms',
              }}
            >
              {idioma}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CursoCard({ curso, value, estadoValue, onChange }) {
  const meta    = ESTADO_META[estadoValue];
  const hasDate = !!value;
  return (
    <div style={{
      background: hasDate ? 'var(--color-primary-surface, #f0f9ff)' : '#f8fafc',
      borderRadius: '12px',
      border: `1.5px solid ${hasDate ? 'var(--color-primary, #0A5C99)' : '#e2e8f0'}`,
      padding: '12px',
      transition: 'all 200ms',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color: hasDate ? 'var(--color-primary)' : '#64748b', fontVariationSettings:"'FILL' 1" }}>
            {curso.icon}
          </span>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color: hasDate ? '#0f172a' : '#475569' }}>
            {curso.label}
          </span>
        </div>
        {meta && (
          <span className={`badge ${meta.cls}`} style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.65rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:10, fontVariationSettings:"'FILL' 1" }}>{meta.icon}</span>
            {estadoValue}
          </span>
        )}
      </div>
      <div className="form-group fm-field" style={{ marginBottom:0 }}>
        <label className="form-label" style={{ fontSize:'0.65rem' }}>Vencimiento</label>
        <input
          name={curso.fecha} type="date"
          className="form-input fm-input"
          style={{ height:32, fontSize:'0.75rem', padding:'0 8px' }}
          value={value ?? ''} onChange={onChange}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STEPPER BAR
══════════════════════════════════════════════════════════════ */
function StepperBar({ currentTab, porcentaje, onTabClick, completedTabs }) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(197,198,210,0.5)',
      padding: '2.5rem 2rem 1.5rem 2rem',
      marginBottom: '1.5rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>

      {/* Barra de progreso superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '4px', width: '100%',
        background: '#e2e8f0',
      }}>
        <div style={{
          height: '100%', width: `${porcentaje}%`,
          background: 'var(--color-primary, #0A5C99)',
          transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {/* Badge % completado */}
      <div style={{
        position: 'absolute', top: '0.75rem', right: '1.5rem',
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(14,155,138,0.1)', padding: '4px 10px',
        borderRadius: '20px', zIndex: 10,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0E9B8A' }}>monitoring</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0E9B8A' }}>{porcentaje}% Completado</span>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        {TABS.map((t, idx) => {
          const isDone   = currentTab > idx;
          const isActive = currentTab === idx;
          const canClick = isDone || completedTabs.includes(idx - 1) || idx === 0;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx < TABS.length - 1 ? 1 : 'none' }}>

              {/* Círculo + label */}
              <div
                onClick={() => canClick && onTabClick(idx)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: canClick ? 'pointer' : 'not-allowed', position: 'relative', width: 120,
                  opacity: (isDone || isActive) ? 1 : canClick ? 0.75 : 0.4,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'var(--color-primary, #0A5C99)' : isDone ? '#0E9B8A' : '#f1f5f9',
                  color: (isActive || isDone) ? '#fff' : '#64748b',
                  border: isActive ? '4px solid rgba(10,92,153,0.15)' : isDone ? 'none' : '1px solid #cbd5e1',
                  boxShadow: isActive ? '0 4px 10px rgba(10,92,153,0.3)' : 'none',
                  transition: 'all 0.3s ease', zIndex: 2,
                }}>
                  {isDone
                    ? <span className="material-symbols-outlined" style={{ fontSize: 20, fontWeight: 600 }}>check</span>
                    : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{t.icon}</span>
                  }
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary, #0A5C99)' : isDone ? '#0E9B8A' : '#64748b',
                  textAlign: 'center', lineHeight: 1.2,
                }}>
                  {t.label}
                </span>
              </div>

              {/* Conector */}
              {idx < TABS.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: isDone ? '#0E9B8A' : '#e2e8f0',
                  margin: '0 -20px', transform: 'translateY(-12px)',
                  transition: 'background 0.3s ease', zIndex: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CALCULAR PROGRESO
══════════════════════════════════════════════════════════════ */
function calcularPorcentaje(med, cont, vin, acc, norm) {
  const campos = [
    med.primer_nombre, med.primer_apellido, med.categoria, med.especialidad,
    cont.tipo_documento, cont.fecha_nacimiento, cont.lugar_nacimiento, cont.sexo,
    cont.correo, cont.celular, cont.direccion_correspondencia,
    vin.tipo_vinculacion, vin.estado_contrato,
    acc.induccion_medica_fsfb, acc.estado_codigo, acc.estado_carnet,
    norm.bls_fecha_venc,
  ];
  const llenos = campos.filter(v => v && String(v).trim() !== '').length;
  return Math.round((llenos / campos.length) * 100);
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function FormFSFB() {
  const navigate      = useNavigate();
  const { documento } = useParams();
  const { showToast, ToastContainer } = useToast();
  const isEdit = Boolean(documento);

  const [tab,           setTab]           = useState(0);
  const [completedTabs, setCompletedTabs] = useState(isEdit ? [0, 1] : []);
  const [docFsfb, setDocFsfb] = useState('');
  const [med,     setMed]     = useState(INIT_MED);
  const [cont,    setCont]    = useState(INIT_CONT);
  const [vin,     setVin]     = useState(INIT_VIN);
  const [acc,     setAcc]     = useState(INIT_ACC);
  const [norm,    setNorm]    = useState(INIT_NORM);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [errors,  setErrors]  = useState({});
  const [rawCats, setRawCats] = useState([]);

  const optCats = useMemo(() => rawCats.map(c => ({ value:c.code, label:`${c.code} – ${c.nombre}` })), [rawCats]);
  const porcentaje = useMemo(() => calcularPorcentaje(med, cont, vin, acc, norm), [med, cont, vin, acc, norm]);

  useEffect(() => {
    axiosInstance.get('/maestras/categorias-metricas', { skipToast:true })
      .then(r => setRawCats(r.data ?? [])).catch(() => {});
    if (!isEdit) return;
    (async () => {
      try {
        const [rM, rCt, rVin, rAcc, rN] = await Promise.allSettled([
          axiosInstance.get(`/medicos/${documento}/`,              { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/contacto/`,     { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/contratacion/`, { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/accesos/`,      { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/normativos/`,   { skipToast:true }),
        ]);
        if (rM.status==='fulfilled')  { const m = rM.value.data??{}; setMed({ primer_nombre:m.primer_nombre??'', segundo_nombre:m.segundo_nombre??'', primer_apellido:m.primer_apellido??'', segundo_apellido:m.segundo_apellido??'', categoria:m.categoria??'', especialidad:m.especialidad??'', anios_cuerpo_medico:m.anios_cuerpo_medico??'' }); }
        if (rCt.status==='fulfilled') {
          const c = rCt.value.data??{};
          const idiomasGuardados = [c.idioma_ingles&&'Inglés', c.idioma_frances&&'Francés', c.idioma_italiano&&'Italiano', c.idioma_aleman&&'Alemán', c.idioma_portugues&&'Portugués'].filter(Boolean);
          setCont(prev => ({
            ...prev,
            correo: c.correo??'', celular: c.celular??'', telefono: c.telefono??'',
            direccion_correspondencia: c.direccion_correspondencia??'',
            direccion_consultorio: c.direccion_consultorio??'',
            tipo_documento: c.tipo_documento??'', lugar_expedicion: c.lugar_expedicion??'',
            fecha_nacimiento: toDate(c.fecha_nacimiento),
            lugar_nacimiento: c.lugar_nacimiento??'', sexo: c.sexo??'',
            estado_civil: c.estado_civil??'', tiene_hijos: c.tiene_hijos??'',
            maneja_lengua_senas: !!c.maneja_lengua_senas,
            idiomas_seleccionados: idiomasGuardados,
            idioma_otro: c.idioma_otro??'',
          }));
        }
        if (rVin.status==='fulfilled'){ const v = rVin.value.data??{}; setVin(Object.fromEntries(Object.keys(INIT_VIN).map(k => [k, v[k]??'']))); }
        if (rAcc.status==='fulfilled'){ const a = rAcc.value.data??{}; setAcc(Object.fromEntries(Object.keys(INIT_ACC).map(k => [k, k==='fecha_venc_poliza'?toDate(a[k]):(a[k]??'')]))); }
        if (rN.status==='fulfilled')  { const n = rN.value.data??{}; setNorm(Object.fromEntries(Object.keys(INIT_NORM).map(k => [k, (k.endsWith('_fecha')||k.endsWith('_fecha_venc'))?toDate(n[k]):(n[k]??'')]))); }
      } catch { showToast?.('Error cargando médico FSFB', 'error'); }
      finally  { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  const bind   = (setter) => (e) => setter(p => ({ ...p, [e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));
  const upsert = async (url, payload) => {
    try { await axiosInstance.put(url, payload); }
    catch (err) { if (err.response?.status===404) await axiosInstance.post(url, payload); else throw err; }
  };

  const handleSave = async () => {
    const errs = {};
    if (!med.primer_nombre?.trim())   errs.primer_nombre   = 'Requerido';
    if (!med.primer_apellido?.trim()) errs.primer_apellido = 'Requerido';
    if (!isEdit && !docFsfb?.trim())  errs.docFsfb         = 'Requerido';
    if (Object.keys(errs).length) { setErrors(errs); setTab(0); return; }
    setErrors({});

    const docId = isEdit ? documento : docFsfb.trim();
    setSaving(true);
    try {
      if (isEdit) await axiosInstance.put(`/medicos/${docId}/`,  { ...med, tipo_listado:'fsfb_externo', estado:'ACTIVO' });
      else        await axiosInstance.post('/medicos/', { ...med, documento_identidad:docId, tipo_listado:'fsfb_externo', estado:'ACTIVO' });

      const idiomasPayload = {
        idioma_ingles:    cont.idiomas_seleccionados.includes('Inglés')    ? 'SI' : '',
        idioma_frances:   cont.idiomas_seleccionados.includes('Francés')   ? 'SI' : '',
        idioma_italiano:  cont.idiomas_seleccionados.includes('Italiano')  ? 'SI' : '',
        idioma_aleman:    cont.idiomas_seleccionados.includes('Alemán')    ? 'SI' : '',
        idioma_portugues: cont.idiomas_seleccionados.includes('Portugués') ? 'SI' : '',
      };

      await Promise.allSettled([
        upsert(`/medicos/${docId}/contacto/`,     { ...cont, ...idiomasPayload, documento_identidad:docId }),
        upsert(`/medicos/${docId}/contratacion/`,  { ...vin,  documento_identidad:docId }),
        upsert(`/medicos/${docId}/accesos/`,       { ...Object.fromEntries(Object.entries(acc).map(([k,v])=>[k,v||null])), documento_identidad:docId }),
        upsert(`/medicos/${docId}/normativos/`,    { ...Object.fromEntries(Object.entries(norm).filter(([k])=>!k.endsWith('_estado')).map(([k,v])=>[k,v||null])), documento_identidad:docId }),
      ]);

      showToast?.('Médico FSFB guardado correctamente', 'success');
      navigate('/medicos-fsfb');
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al guardar';
      showToast?.(Array.isArray(msg) ? msg.map(m => m.msg ?? JSON.stringify(m)).join(' · ') : msg, 'error');
    } finally { setSaving(false); }
  };

  const nombreCompleto = [med.primer_nombre, med.primer_apellido].filter(Boolean).join(' ') || null;

  const markTabCompleted = (n) => setCompletedTabs(prev => [...new Set([...prev, n])]);

  const validateTab0 = () => {
    const errs = {};
    if (!med.primer_nombre?.trim())   errs.primer_nombre   = 'Requerido';
    if (!med.primer_apellido?.trim()) errs.primer_apellido = 'Requerido';
    if (!isEdit && !docFsfb?.trim())  errs.docFsfb         = 'Requerido';
    return errs;
  };

  const handleNext = () => {
    if (tab === 0) {
      const errs = validateTab0();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      markTabCompleted(0);
      setTab(1);
    } else if (tab === 1) {
      markTabCompleted(1);
      setTab(2);
    }
  };

  if (loading) return (
    <div className="fm-root">
      <div style={{ padding:'var(--space-8)', maxWidth:'1620px', margin:'0 auto', width:'100%' }}>
        {Array.from({ length:4 }).map((_,i) => (
          <div key={i} className="skeleton" style={{ height:100, borderRadius:'16px', marginBottom:'16px' }} />
        ))}
      </div>
    </div>
  );

  return (
  <div className="fm-root">

    <StepperBar currentTab={tab} porcentaje={porcentaje} onTabClick={setTab} completedTabs={completedTabs} />

    <div className="fm-content fm-animate-in">

      {/* ══ HEADER HERO — debajo del stepper ══ */}
      <div className="fm-hero-header">
        <div className="fm-hero-header-inner">
          <div className="fm-hero-title-row">
            <div className="fm-hero-icon-wrap">
              <span className="material-symbols-outlined">{isEdit ? 'manage_accounts' : 'person_add'}</span>
            </div>
            <div>
              <h2 className="fm-hero-title">
                {isEdit ? 'Editar médico FSFB' : 'Nuevo médico FSFB'}
                <span className="fm-hero-subtitle"> — {TABS[tab].label}</span>
              </h2>
              <p className="fm-hero-desc">Personal externo vinculado — Fundación Santa Fe</p>
            </div>
          </div>

          {isEdit && nombreCompleto && (
            <div className="fm-doctor-chip">
              <div className="fm-doctor-chip-avatar">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="fm-doctor-chip-info">
                <span className="fm-doctor-chip-name">{nombreCompleto}</span>
                <span className="fm-doctor-chip-doc">CC {documento}</span>
              </div>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#22c55e', display: 'inline-block', marginLeft: 4,
              }} />
            </div>
          )}
        </div>
      </div>

      {/* ══ TABS ══ */}
      {/* ... resto del contenido sin cambios ... */}
       {/* ══ TABS ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
          {/* ════ TAB 0: DATOS PERSONALES ════ */}
          {tab === 0 && (
            <>
              <SectionCard title="IDENTIFICACIÓN" icon="badge">
                <div className="fm-grid fm-grid-3">
                  {!isEdit && (
                    <Campo label="N.° DOCUMENTO" name="docFsfb" value={docFsfb} onChange={e => setDocFsfb(e.target.value)} required error={errors.docFsfb} placeholder="Cédula del médico" />
                  )}
                  <CampoSelect label="TIPO DOCUMENTO" name="tipo_documento" value={cont.tipo_documento} onChange={bind(setCont)} options={OPT_TIPO_DOC} />
                  <CampoSelect label="LUGAR DE EXPEDICIÓN" name="lugar_expedicion" value={cont.lugar_expedicion} onChange={bind(setCont)} options={OPT_LUGAR_NAC} placeholder="Ciudad" />
                </div>
              </SectionCard>

              <SectionCard title="NOMBRE COMPLETO" icon="person">
                <div className="fm-grid fm-grid-4">
                  <Campo label="PRIMER NOMBRE" name="primer_nombre" value={med.primer_nombre} onChange={bind(setMed)} required error={errors.primer_nombre} placeholder="Primer nombre" />
                  <Campo label="SEGUNDO NOMBRE" name="segundo_nombre" value={med.segundo_nombre} onChange={bind(setMed)} placeholder="Opcional" />
                  <Campo label="PRIMER APELLIDO" name="primer_apellido" value={med.primer_apellido} onChange={bind(setMed)} required error={errors.primer_apellido} placeholder="Primer apellido" />
                  <Campo label="SEGUNDO APELLIDO" name="segundo_apellido" value={med.segundo_apellido} onChange={bind(setMed)} placeholder="Opcional" />
                  <CampoSelect label="CATEGORÍA" name="categoria" value={med.categoria} onChange={bind(setMed)} options={optCats} />
                  <Campo label="ESPECIALIDAD" name="especialidad" value={med.especialidad} onChange={bind(setMed)} placeholder="Ej: Anestesiología" span={3} />
                </div>
              </SectionCard>

              <SectionCard title="DATOS PERSONALES" icon="person_pin">
                <div className="fm-grid fm-grid-4">
                  <Campo label="FECHA DE NACIMIENTO" name="fecha_nacimiento" type="date" value={cont.fecha_nacimiento} onChange={bind(setCont)} />
                  <CampoSelect label="LUGAR DE NACIMIENTO" name="lugar_nacimiento" value={cont.lugar_nacimiento} onChange={bind(setCont)} options={OPT_LUGAR_NAC} placeholder="Ciudad, Dpto." />
                  <CampoSelect label="GÉNERO" name="sexo" value={cont.sexo} onChange={bind(setCont)} options={OPT_SEXO} />
                  <CampoSelect label="ESTADO CIVIL" name="estado_civil" value={cont.estado_civil} onChange={bind(setCont)} options={OPT_EST_CIVIL} />
                  <CampoSelect label="¿TIENE HIJOS?" name="tiene_hijos" value={cont.tiene_hijos} onChange={bind(setCont)} options={[{ value:'SI', label:'Sí' },{ value:'NO', label:'No' }]} span={2} />
                  <Campo label="AÑOS EN HOSPITAL" name="anios_cuerpo_medico" type="number" value={med.anios_cuerpo_medico} onChange={bind(setMed)} placeholder="Ej: 5" span={2} />
                </div>
              </SectionCard>

              <SectionCard title="CONTACTO" icon="contact_phone">
                <div className="fm-grid fm-grid-4">
                  <Campo label="CORREO ELECTRÓNICO" name="correo" type="email" value={cont.correo} onChange={bind(setCont)} placeholder="correo@ejemplo.com" span={2} />
                  <Campo label="CELULAR" name="celular" value={cont.celular} onChange={bind(setCont)} placeholder="+57 300 000 0000" />
                  <Campo label="TELÉFONO FIJO" name="telefono" value={cont.telefono} onChange={bind(setCont)} />
                  <Campo label="DIRECCIÓN CORRESPONDENCIA" name="direccion_correspondencia" value={cont.direccion_correspondencia} onChange={bind(setCont)} span={2} />
                  <Campo label="DIRECCIÓN CONSULTORIO" name="direccion_consultorio" value={cont.direccion_consultorio} onChange={bind(setCont)} span={2} />
                </div>
              </SectionCard>

              <SectionCard title="IDIOMAS Y HABILIDADES" icon="translate">
                <div className="fm-grid fm-grid-4">
                  <IdiomasChips
                    seleccionados={cont.idiomas_seleccionados}
                    onChange={(val) => setCont(p => ({ ...p, idiomas_seleccionados: val }))}
                    span={4}
                  />
                  <Campo label="OTRO IDIOMA" name="idioma_otro" value={cont.idioma_otro} onChange={bind(setCont)} placeholder="Especificar…" span={2} />
                  <ToggleSwitch
                    label="LENGUAJE DE SEÑAS"
                    checked={!!cont.maneja_lengua_senas}
                    onChange={(val) => setCont(p => ({ ...p, maneja_lengua_senas: val }))}
                    span={2}
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* ════ TAB 1: CONTRATACIÓN Y ACCESOS ════ */}
          {tab === 1 && (
            <>
              <SectionCard title="VINCULACIÓN CONTRACTUAL" icon="handshake">
                <div className="fm-grid fm-grid-4">
                  <CampoSelect label="TIPO VINCULACIÓN" name="tipo_vinculacion" value={vin.tipo_vinculacion} onChange={bind(setVin)} options={OPT_VIN} />
                  <CampoSelect label="ESTADO CONTRATO" name="estado_contrato" value={vin.estado_contrato} onChange={bind(setVin)} options={OPT_EST} />
                  <CampoSelect label="MODALIDAD HONORARIOS" name="modalidad_honorarios" value={vin.modalidad_honorarios} onChange={bind(setVin)} options={[{ value:'Fijo', label:'Fijo' }, { value:'Variable', label:'Variable' }, { value:'Mixto', label:'Mixto' }]} />
                  <Campo label="TIEMPO LABORADO" name="tiempo_laborado" value={vin.tiempo_laborado} onChange={bind(setVin)} placeholder="Ej: 2 años" />
                </div>
              </SectionCard>

              <SectionCard title="INDUCCIONES" icon="school">
                <div className="fm-grid fm-grid-3">
                  <CampoSelect label="INDUCCIÓN MÉDICA FSFB" name="induccion_medica_fsfb" value={acc.induccion_medica_fsfb} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="INDUCCIÓN MÉDICA CHSM" name="induccion_medica_chsm" value={acc.induccion_medica_chsm} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="INDUCCIÓN GENERAL CHSM" name="induccion_general_chsm" value={acc.induccion_general_chsm} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="INDUCCIÓN HIS-ISIS" name="induccion_his_isis" value={acc.induccion_his_isis} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="PERFIL DE CARGO" name="perfil_cargo" value={acc.perfil_cargo} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="ENTRENAMIENTO" name="entrenamiento" value={acc.entrenamiento} onChange={bind(setAcc)} options={OPT_SNA} />
                </div>
              </SectionCard>

              <SectionCard title="ACREDITACIONES Y ACCESOS" icon="verified_user">
                <SubLabel>Credenciales Institucionales</SubLabel>
                <div className="fm-grid fm-grid-3" style={{ marginBottom: '1.5rem' }}>
                  <CampoSelect label="ESTADO CÓDIGO" name="estado_codigo" value={acc.estado_codigo} onChange={bind(setAcc)} options={OPT_EST} />
                  <Campo label="CÓDIGO SMM" name="codigo_smm" value={acc.codigo_smm} onChange={bind(setAcc)} placeholder="Código asignado" />
                  <CampoSelect label="ESTADO CARNET" name="estado_carnet" value={acc.estado_carnet} onChange={bind(setAcc)} options={OPT_EST} />
                  <Campo label="TARJETA ACCESO" name="tarjeta_acceso" value={acc.tarjeta_acceso} onChange={bind(setAcc)} />
                  <CampoSelect label="ESTADO BATA" name="estado_bata" value={acc.estado_bata} onChange={bind(setAcc)} options={OPT_EST} />
                  <Campo label="CORREO CORPORATIVO" name="correo_corporativo" type="email" value={acc.correo_corporativo} onChange={bind(setAcc)} placeholder="correo@serena.com.co" />
                </div>
                <SubLabel>Herramientas y Entregas</SubLabel>
                <div className="fm-grid fm-grid-5">
                  <CampoSelect label="ALMERA" name="entrega_almera" value={acc.entrega_almera} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="RUAF" name="entrega_ruaf" value={acc.entrega_ruaf} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="MIPRES" name="mipres" value={acc.mipres} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="RADIO EXPUESTO" name="radio_expuesto" value={acc.radio_expuesto} onChange={bind(setAcc)} options={OPT_SNA} />
                  <CampoSelect label="CARTA DE TURNOS" name="carta_turnos" value={acc.carta_turnos} onChange={bind(setAcc)} options={OPT_SNA} />
                </div>
              </SectionCard>

              <SectionCard title="PÓLIZAS" icon="policy">
                <div className="fm-grid fm-grid-4">
                  <CampoSelect label="PÓLIZA RESP. CIVIL" name="poliza_resp_civil" value={acc.poliza_resp_civil} onChange={bind(setAcc)} options={OPT_EST} />
                  <Campo label="VENCIMIENTO PÓLIZA" name="fecha_venc_poliza" type="date" value={acc.fecha_venc_poliza} onChange={bind(setAcc)} />
                  <CampoSelect label="PÓLIZA COMPLICACIONES" name="poliza_complicaciones" value={acc.poliza_complicaciones} onChange={bind(setAcc)} options={OPT_EST} span={2} />
                </div>
              </SectionCard>
            </>
          )}

          {/* ════ TAB 2: NORMATIVIDAD ════ */}
          {tab === 2 && (
            <SectionCard title="CURSOS NORMATIVOS Y VENCIMIENTOS" icon="workspace_premium">
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px', background:'#eff6ff', color:'#1e40af', borderRadius:'8px', marginBottom:'1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1" }}>info</span>
                <span style={{ fontSize:'0.8125rem' }}>Registra la fecha de vencimiento de cada curso completado. El sistema calculará el estado vigente automáticamente.</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
                {CURSOS.map(c => (
                  <CursoCard key={c.fecha} curso={c} value={norm[c.fecha]} estadoValue={norm[c.estado]} onChange={bind(setNorm)} />
                ))}
                <div style={{
                  background: 'var(--color-primary-surface, #f0f9ff)',
                  borderRadius: '12px',
                  border: '1.5px solid var(--color-primary, #0A5C99)',
                  padding: '12px',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--color-primary, #0A5C99)', fontVariationSettings:"'FILL' 1" }}>history_edu</span>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#0f172a' }}>Cursos 3 años</span>
                  </div>
                  <CampoSelect label="ESTADO" name="cursos_3_anios" value={norm.cursos_3_anios} onChange={bind(setNorm)} options={OPT_SNA} />
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={() => tab > 0 ? setTab(tab - 1) : navigate('/medicos-fsfb')} disabled={saving}>
          <span className="material-symbols-outlined sm">{tab === 0 ? 'close' : 'arrow_back'}</span>
          {tab === 0 ? 'Cancelar' : 'Anterior'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, minHeight: 'inherit' }}>
          {saving && (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined sm" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
              Guardando…
            </span>
          )}
          <button className="btn btn-signature" onClick={tab === TABS.length - 1 ? handleSave : handleNext} disabled={saving}>
            {tab === TABS.length - 1 ? (
              <><span className="material-symbols-outlined sm">save</span> Guardar</>
            ) : (
              <>Siguiente <span className="material-symbols-outlined sm">arrow_forward</span></>
            )}
          </button>
        </div>
      </div>

      {ToastContainer && <ToastContainer />}
    </div>
  );
}