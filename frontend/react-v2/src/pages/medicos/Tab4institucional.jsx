import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axiosInstance from '../../api/axiosInstance';
import FileUploadField from '../../components/shared/FileUploadField';
import CredentialModal from '../../components/shared/CredentialModal';


/* ── Helpers ── */
const toDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};


/* ── Opciones ── */
const OPTSINO    = [{ value: '', label: 'Seleccionar' }, { value: 'SI', label: 'Sí' }, { value: 'N/A', label: 'N/a' }, { value: 'PENDIENTE', label: 'Pendiente' }];
const OPTSINONA  = [{ value: '', label: 'Seleccionar' }, { value: 'SI', label: 'Sí' }, { value: 'NO', label: 'No' }, { value: 'NA', label: 'N/a' }];
const OPTESTADO  = [{ value: '', label: 'Seleccionar' }, { value: 'ACTIVO', label: 'Activo' },  { value: 'NA', label: 'N/A' }];
const CONTRATOCONDICIONES = [{ value: '', label: 'Seleccionar' }, { value: 'SALARIO BASE', label: 'Salario Base' }, { value: 'SALARIO BASE + JORNADAS ADICIONALES', label: 'Salario Base + Jornadas Adicionales' }, { value: 'SALARIO BASE + JORNADAS ADICIONALES + PRODUCTIVIDAD', label: 'Salario Base + Jornadas Adicionales + Productividad' }, { value: 'SALARIO BASE + PRODUCTIVIDAD', label: 'Salario Base + Productividad' }, {value: 'SALARIO BASE + DISPNIBILIDAD', label: 'Salario Base + Disponibilidad'}, {value: 'SALARIO BASE + DISPNIBILIDAD + PRODUCTIVIDAD', label: 'Salario Base + Disponibilidad + Productividad'  },{value: 'SALARIO BASE + BONIFICACION', label: 'Salario Base + Bonificación'}, { value: 'NA', label: 'N/A' }];
const TCONTRATO= [{ value: '', label: 'Seleccionar' }, { value: 'INDIFINIDO', label: 'Indefinido' }, { value: 'TERMINO FIJO', label: 'Término Fijo' }, { value: 'TEMPORAL', label: 'Temporal' }, { value: 'NA', label: 'N/A' }];
const MCONTRATO= [{ value: '', label: 'Seleccionar' }, { value: 'RVG', label: 'RVG' }, { value: 'TARIJA HORA', label: 'Tarifa Hora' }, { value: 'VALOR FIJO', label: 'Valor Fijo' }, { value: 'RVG + MIN GARANTZADO', label: 'RVG + Mínimo Garantizado' }, { value: 'RVG + TARIFARIO', label: 'RVG + Tarifario' }, { value: 'NA', label: 'N/A' }];
const OPTCONTRATO= [{ value: '', label: 'Seleccionar' }, { value: 'LABORAL', label: 'Laboral' }, { value: 'OFERTA MERCANTIL', label: 'Oferta Mercantil' }, { value: 'LABORAL/OFERTA MERCANTIL', label: 'Laboral / Oferta Mercantil' }, { value: 'NA', label: 'N/A' }];


/* ── Cursos normativos ── */
const CURSOS = [
  { key: 'bls',                   label: 'BLS',                        icon: 'favorite'            },
  { key: 'acls',                  label: 'ACLS',                       icon: 'monitor_heart'       },
  { key: 'pals',                  label: 'PALS',                       icon: 'child_care'          },
  { key: 'nals',                  label: 'NALS',                       icon: 'baby_changing_station'},
  { key: 'violenciasexual',       label: 'Violencia Sexual',           icon: 'shield_person'       },
  { key: 'ataquesagentesquimicos',label: 'Agentes Químicos',           icon: 'science'             },
  { key: 'dengue',                label: 'Dengue',                     icon: 'bug_report'          },
  { key: 'sedacion',              label: 'Sedación',                   icon: 'medication'          },
  { key: 'cuidadodonanteins',     label: 'Gest. Donación',             icon: 'volunteer_activism'  },
  { key: 'radioproteccion',       label: 'Radioprotección',            icon: 'radar'               },
  { key: 'manejodolor',           label: 'Manejo del Dolor',           icon: 'healing'             },
  { key: 'iamii',                 label: 'IAMII',                      icon: 'cardiology'          },
  { key: 'gestionduelo',          label: 'Gestión del Duelo',          icon: 'sentiment_sad'       },
  { key: 'curso3anos',            label: 'Póliza RC',                  icon: 'policy'              },
];

const ESTADO_BADGE = {
  VIGENTE:    { bg: 'rgba(22,163,74,0.12)',  color: '#15803d', icon: 'check_circle'  },
  'Por vencer':{ bg: 'rgba(234,179,8,0.12)', color: '#a16207', icon: 'schedule'      },
  VENCIDO:    { bg: 'rgba(220,38,38,0.12)',  color: '#b91c1c', icon: 'cancel'        },
};

function getEstadoCurso(fecha) {
  if (!fecha) return 'VIGENTE';
  const diff = (new Date(fecha) - new Date()) / 86400000;
  if (diff < 0)   return 'VENCIDO';
  if (diff <= 60) return 'Por vencer';
  return 'VIGENTE';
}

const vKey = (key) => key === 'curso3anos' ? 'vigenciacurso3anos' : `vencimiento${key}`;


/* ── Estados iniciales ── */
/* RESOLUCIONES — tratadas como CursoCards con fecha vencimiento */
const RESOLUCIONES = [
  { key: 'resolejercicioplaza', label: 'Resol. Ejercicio Plaza',  icon: 'gavel'          },
  { key: 'resolanastesiologo',  label: 'Resol. Anestesiólogo',    icon: 'medical_services'},
];

const buildInitNormativos = () => {
  const init = {
    /* resoluciones: aplica + fecha vencimiento */
    aplicaresolejercicioplaza: false, vencimientoresolejercicioplaza: null,
    aplicaresolanastesiologo:  false, vencimientoresolanastesiologo:  null,
  };
  CURSOS.forEach(c => {
    init[`aplica${c.key}`]  = false;
    init[`norma${c.key}`]   = '';
    init[vKey(c.key)]       = null;
  });
  return init;
};


const buildInitContratacion = () => ({
  tipovinculacion: '', estadocontratolaboral: '', jornadalaboralcontrato: '',
  tipocontrato: '', fechafirmacontratacion: null, condicionescontratacion: '',
  estadoofertamercantil: '', persona: '',
  fechafirmaofertamercantil: null, fechavencimientoofertamercantil: null,
  firmaacepprelegal: '', fechafirmaacepprelegal: null,
  modalidadhorario: '', ofertacondicionesespeciales: '',
  induccionmedicahsm: '', induccionmedicachsm: '', inducciongeneralchsm: '', induccionhisisis: '',
  perfilcargo: '', entrenamiento: '',
  estadocodigo: '', codigo: '', estadocarnet: '', tarjetaacceso: '', estadobata: '',
  entregaalmera: '', entregaruaf: '', mipres: '', correocorp: '',
  radioexpuesto: '', cartaturnos: '', inspekor: '',
});


/* ══════════════════════════════════════════════════════════════
   SUBCOMPONENTES UI
   ══════════════════════════════════════════════════════════════ */
function SectionCard({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:'var(--color-surface,#fff)', border:'1px solid rgba(26,78,215,0.09)', borderRadius:12, marginBottom:16, overflow:'hidden', boxShadow:'0 1px 6px rgba(26,78,215,0.05)' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'14px 20px', background:'none', border:'none', cursor:'pointer', borderBottom: open ? '1px solid rgba(26,78,215,0.07)' : 'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="material-symbols-outlined" style={{ fontSize:18, color:'var(--color-primary,#1a4ed7)', fontVariationSettings:"'FILL' 1" }}>{icon}</span>
          <span style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--color-on-surface,#1e293b)', letterSpacing:'0.03em', textTransform:'uppercase' }}>{title}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize:18, color:'#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 200ms' }}>expand_more</span>
      </button>
      {open && <div style={{ padding:20 }}>{children}</div>}
    </div>
  );
}


function SimpleSelect({ label, value, onChange, options, disabled, hint }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-select" value={value ?? ''} onChange={onChange} disabled={disabled}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <span style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:3, display:'block' }}>{hint}</span>}
    </div>
  );
}


function SimpleInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input type={type} className="form-input" value={value ?? ''} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}


function CampoFechaNullable({ label, fieldKey, value, onChangeFn }) {
  const esNA = value === null;
  return (
    <div className="form-group">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        {label && <label className="form-label" style={{ marginBottom:0 }}>{label}</label>}
        <button type="button" onClick={() => onChangeFn(fieldKey, esNA ? '' : null)}
          style={{ fontSize:'0.6875rem', fontWeight:700, padding:'1px 8px', borderRadius:9999, border:'none', cursor:'pointer', background: esNA ? 'rgba(148,163,184,0.20)' : 'rgba(26,78,215,0.08)', color: esNA ? '#64748b' : 'var(--color-primary,#1a4ed7)', transition:'all 160ms' }}>
          {esNA ? 'Agregar fecha' : 'N/A'}
        </button>
      </div>
      {esNA
        ? <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(148,163,184,0.08)', border:'1px dashed rgba(148,163,184,0.3)', fontSize:'0.8125rem', color:'#94a3b8', textAlign:'center' }}>No aplica — fecha nula</div>
        : <input type="date" className="form-input" value={value ?? ''} onChange={e => onChangeFn(fieldKey, e.target.value || null)} />
      }
    </div>
  );
}

/* ── CursoCard — diseño unificado con FormFSFB ── */
function CursoCard({ curso, aplica, vencimiento, onChange, medicoDoc }) {
  const estado = aplica ? getEstadoCurso(vencimiento) : null;
  const badge  = estado ? ESTADO_BADGE[estado] : null;
  return (
    <div style={{
      background: aplica ? 'rgba(10,92,153,0.04)' : '#f8fafc',
      borderRadius: 12,
      border: `1.5px solid ${aplica ? 'var(--color-primary,#0A5C99)' : '#e2e8f0'}`,
      padding: 12,
      transition: 'all 200ms',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Fila 1: icono + nombre (flex:1) | toggle (sin competir con badge) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: aplica ? 'var(--color-primary,#0A5C99)' : '#94a3b8', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>
            {curso.icon}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: aplica ? '#0f172a' : '#64748b', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {curso.label}
          </span>
        </div>
        <button type="button" onClick={() => onChange(`aplica${curso.key}`, !aplica)} style={{
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          padding: '2px 8px 2px 4px', borderRadius: 9999,
          border: 'none', cursor: 'pointer',
          background: aplica ? 'rgba(10,92,153,0.10)' : 'rgba(148,163,184,0.12)',
          transition: 'all 180ms',
          fontSize: '0.65rem', fontWeight: 700,
          color: aplica ? 'var(--color-primary,#0A5C99)' : '#94a3b8',
        }}>
          <div style={{ width: 22, height: 12, borderRadius: 6, background: aplica ? 'var(--color-primary,#0A5C99)' : '#cbd5e1', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, left: aplica ? 12 : 2, width: 8, height: 8, borderRadius: '50%', background: 'white', transition: 'left 180ms cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
          {aplica ? 'Aplica' : 'N/A'}
        </button>
      </div>

      {/* Fila 2: badge de estado en su propia línea (modelo FormFSFB) */}
      {badge && (
        <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 9999, background: badge.bg, color: badge.color, fontSize: '0.65rem', fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
          {estado}
        </span>
      )}

      {/* Fila 3: input de fecha */}
      {aplica && (
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Vencimiento</label>
          <input type="date" className="form-input"
            style={{ height: 32, fontSize: '0.75rem', padding: '0 8px', width: '100%' }}
            value={vencimiento ?? ''}
            onChange={e => onChange(vKey(curso.key), e.target.value || null)} />
        </div>
      )}
      {/* Adjunto cuando aplica */}
      {aplica && medicoDoc && (
        <FileUploadField
          carpeta="normativos"
          maxArchivos={1}
          medicoDoc={medicoDoc}
          campoRef={curso.key}
          compact
          label={`Adjuntar ${curso.label}`}
        />
      )}
    </div>
  );
}


/* ── VigenciaOferta — badge de estado de la oferta mercantil ── */
function VigenciaOferta({ fecha }) {
  if (!fecha) return null;
  const dias = Math.ceil((new Date(fecha + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  let bg, color, icon, texto;
  if (dias < 0)    { bg = 'rgba(220,38,38,0.12)';  color = '#b91c1c'; icon = 'cancel';       texto = `Vencida hace ${Math.abs(dias)}d`; }
  else if (dias <= 30) { bg = 'rgba(234,179,8,0.12)'; color = '#a16207'; icon = 'schedule';      texto = `Vence en ${dias}d`; }
  else             { bg = 'rgba(22,163,74,0.12)';  color = '#15803d'; icon = 'check_circle'; texto = 'VIGENTE'; }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:9999, background:bg, color, fontSize:'0.75rem', fontWeight:700 }}>
      <span className="material-symbols-outlined" style={{ fontSize:13, fontVariationSettings:"'FILL' 1" }}>{icon}</span>
      {texto}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — Tab4: Contratación y Normativos
   ══════════════════════════════════════════════════════════════ */
const Tab4Institucional = forwardRef(function Tab4Institucional({ medicoDoc, onNext, onPrev, markCompleted }, ref) {
  const [normativos,   setNormativos]   = useState(buildInitNormativos);
  const [contratacion, setContratacion] = useState(buildInitContratacion);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [dirty,        setDirty]        = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState(null);


  /* ── Carga ── */
  useEffect(() => {
    if (!medicoDoc) { setLoading(false); return; }
    setLoading(true);
    const load = async () => {
      try {
        const [rNorm, rCont, rAcc] = await Promise.allSettled([
          axiosInstance.get(`/medicos/${medicoDoc}/normativos/`,   { skipToast: true }),
          axiosInstance.get(`/medicos/${medicoDoc}/contratacion/`, { skipToast: true }),
          axiosInstance.get(`/medicos/${medicoDoc}/accesos/`,      { skipToast: true }),
        ]);

        const dNorm = rNorm.status === 'fulfilled' ? rNorm.value.data : {};
        const dCont = rCont.status === 'fulfilled' ? rCont.value.data : {};
        const dAcc  = rAcc.status  === 'fulfilled' ? rAcc.value.data  : {};

        setNormativos(prev => ({
          ...prev,
          aplicaresolejercicioplaza: !!dNorm.res_ejercicio_fecha_venc,
          vencimientoresolejercicioplaza: toDate(dNorm.res_ejercicio_fecha_venc),
          aplicaresolanastesiologo:  !!dNorm.res_anestesiologo_fecha_venc,
          vencimientoresolanastesiologo:  toDate(dNorm.res_anestesiologo_fecha_venc),

          aplicabls:                !!dNorm.bls_fecha_venc || !!dNorm.bls_estado,               vencimientobls:                toDate(dNorm.bls_fecha_venc),
          aplicaacls:               !!dNorm.acls_fecha_venc || !!dNorm.acls_estado,              vencimientoacls:               toDate(dNorm.acls_fecha_venc),
          aplicapals:               !!dNorm.pals_fecha_venc || !!dNorm.pals_estado,              vencimientopals:               toDate(dNorm.pals_fecha_venc),
          aplicanals:               !!dNorm.nals_fecha_venc || !!dNorm.nals_estado,              vencimientonals:               toDate(dNorm.nals_fecha_venc),
          aplicaviolenciasexual:    !!dNorm.violencia_sexual_fecha || !!dNorm.violencia_sexual_estado,       vencimientoviolenciasexual:    toDate(dNorm.violencia_sexual_fecha),
          aplicaataquesagentesquimicos: !!dNorm.ataques_quimicos_fecha || !!dNorm.ataques_quimicos_estado,   vencimientoataquesagentesquimicos: toDate(dNorm.ataques_quimicos_fecha),
          aplicadengue:             !!dNorm.dengue_fecha || !!dNorm.dengue_estado,                 vencimientodengue:             toDate(dNorm.dengue_fecha),
          aplicasedacion:           !!dNorm.sedacion_fecha || !!dNorm.sedacion_estado,               vencimientosedacion:           toDate(dNorm.sedacion_fecha),
          aplicamanejodolor:        !!dNorm.manejo_dolor_fecha || !!dNorm.manejo_dolor_estado,           vencimientomanejodolor:        toDate(dNorm.manejo_dolor_fecha),
          aplicaradioproteccion:    !!dNorm.radioproteccion_fecha || !!dNorm.radioproteccion_estado,        vencimientoradioproteccion:    toDate(dNorm.radioproteccion_fecha),
          aplicaiamii:              !!dNorm.iamii_fecha || !!dNorm.iamii_estado,                  vencimientoiamii:              toDate(dNorm.iamii_fecha),
          aplicagestionduelo:       !!dNorm.gestion_duelo_fecha || !!dNorm.gestion_duelo_estado,          vencimientogestionduelo:       toDate(dNorm.gestion_duelo_fecha),
          aplicacurso3anos:         !!dNorm.cursos_3_anios_fecha_venc || !!dNorm.cursos_3_anios_estado,   vigenciacurso3anos:            toDate(dNorm.cursos_3_anios_fecha_venc),
        }));

        setContratacion(prev => ({
          ...prev,
          tipovinculacion:            dCont.tipo_vinculacion    ?? '',
          estadocontratolaboral:      dCont.estado_contrato     ?? '',
          jornadalaboralcontrato:     dCont.jornada             ?? '',
          tipocontrato:               dCont.tipo_contrato       ?? '',
          fechafirmacontratacion:     toDate(dCont.fecha_firma_contrato),
          condicionescontratacion:    dCont.condiciones_contrato ?? '',
          estadoofertamercantil:      dCont.estado_oferta       ?? '',
          persona:                    dCont.tipo_persona        ?? '',
          fechafirmaofertamercantil:  toDate(dCont.fecha_firma_oferta),
          fechavencimientoofertamercantil: toDate(dCont.fecha_venc_oferta),
          modalidadhorario:           dCont.modalidad_honorarios ?? '',
          ofertacondicionesespeciales:dCont.condiciones_especiales ?? '',

          induccionmedicahsm:   dAcc.induccion_medica_fsfb ?? '',
          induccionmedicachsm:  dAcc.induccion_medica_chsm ?? '',
          inducciongeneralchsm: dAcc.induccion_general_chsm ?? '',
          induccionhisisis:     dAcc.induccion_his_isis    ?? '',
          perfilcargo:          dAcc.perfil_cargo           ?? '',
          entrenamiento:        dAcc.entrenamiento          ?? '',
          estadocodigo:         dAcc.estado_codigo          ?? '',
          codigo:               dAcc.codigo_smm             ?? '',
          estadocarnet:         dAcc.estado_carnet          ?? '',
          tarjetaacceso:        dAcc.tarjeta_acceso         ?? '',
          estadobata:           dAcc.estado_bata            ?? '',
          entregaalmera:        dAcc.entrega_almera         ?? '',
          entregaruaf:          dAcc.entrega_ruaf           ?? '',
          mipres:               dAcc.mipres                 ?? '',
          correocorp:           dAcc.correo_corporativo     ?? '',
          radioexpuesto:        dAcc.radio_expuesto         ?? '',
          cartaturnos:          dAcc.carta_turnos           ?? '',
          inspekor:             dAcc.inspektor              ?? '',
        }));

      } catch (e) {
        console.error('Tab4 load error', e);
      } finally {
        setLoading(false);
        setDirty(false);
      }
    };
    load();
  }, [medicoDoc]);

  /* ── Handlers ── */
  const chgNorm = (field, value) => {
    if (field.startsWith('aplica') && value === false && normativos[field] === true) {
      const cursoKey = field.replace('aplica', '');
      const cursoInfo = [...CURSOS, ...RESOLUCIONES].find(c => c.key === cursoKey);
      setPendingDeactivation({ field, cursoLabel: cursoInfo?.label || cursoKey });
      return;
    }
    setNormativos(p => ({ ...p, [field]: value }));
    setDirty(true);
  };
  const chgCont = (field, value) => { setContratacion(p => ({ ...p, [field]: value })); setDirty(true); };

  /* ── Upsert ── */
  const upsert = async (url, payload) => {
    try {
      await axiosInstance.put(url, payload);
    } catch (err) {
      if (err.response?.status === 404)
        await axiosInstance.post(url, { ...payload, documento_identidad: medicoDoc });
      else throw err;
    }
  };

  /* ── Persistir en API sin navegar (reutilizable desde stepper) ── */
  const saveData = async () => {
    const n = normativos;
    const c = contratacion;

    const normPayload = {
      res_ejercicio_fecha_venc:     n.aplicaresolejercicioplaza ? (n.vencimientoresolejercicioplaza || null) : null,
      res_anestesiologo_fecha_venc: n.aplicaresolanastesiologo  ? (n.vencimientoresolanastesiologo  || null) : null,
      bls_fecha_venc:              n.aplicabls ? (n.vencimientobls || null) : null,
      bls_estado:                  n.aplicabls ? getEstadoCurso(n.vencimientobls) : null,
      acls_fecha_venc:             n.aplicaacls ? (n.vencimientoacls || null) : null,
      acls_estado:                 n.aplicaacls ? getEstadoCurso(n.vencimientoacls) : null,
      pals_fecha_venc:             n.aplicapals ? (n.vencimientopals || null) : null,
      pals_estado:                 n.aplicapals ? getEstadoCurso(n.vencimientopals) : null,
      nals_fecha_venc:             n.aplicanals ? (n.vencimientonals || null) : null,
      nals_estado:                 n.aplicanals ? getEstadoCurso(n.vencimientonals) : null,
      violencia_sexual_fecha:      n.aplicaviolenciasexual ? (n.vencimientoviolenciasexual || null) : null,
      violencia_sexual_estado:     n.aplicaviolenciasexual ? getEstadoCurso(n.vencimientoviolenciasexual) : null,
      ataques_quimicos_fecha:      n.aplicaataquesagentesquimicos ? (n.vencimientoataquesagentesquimicos || null) : null,
      ataques_quimicos_estado:     n.aplicaataquesagentesquimicos ? getEstadoCurso(n.vencimientoataquesagentesquimicos) : null,
      dengue_fecha:                n.aplicadengue ? (n.vencimientodengue || null) : null,
      dengue_estado:               n.aplicadengue ? getEstadoCurso(n.vencimientodengue) : null,
      sedacion_fecha:              n.aplicasedacion ? (n.vencimientosedacion || null) : null,
      sedacion_estado:             n.aplicasedacion ? getEstadoCurso(n.vencimientosedacion) : null,
      manejo_dolor_fecha:          n.aplicamanejodolor ? (n.vencimientomanejodolor || null) : null,
      manejo_dolor_estado:         n.aplicamanejodolor ? getEstadoCurso(n.vencimientomanejodolor) : null,
      radioproteccion_fecha:       n.aplicaradioproteccion ? (n.vencimientoradioproteccion || null) : null,
      radioproteccion_estado:      n.aplicaradioproteccion ? getEstadoCurso(n.vencimientoradioproteccion) : null,
      iamii_fecha:                 n.aplicaiamii ? (n.vencimientoiamii || null) : null,
      iamii_estado:                n.aplicaiamii ? getEstadoCurso(n.vencimientoiamii) : null,
      gestion_duelo_fecha:         n.aplicagestionduelo ? (n.vencimientogestionduelo || null) : null,
      gestion_duelo_estado:        n.aplicagestionduelo ? getEstadoCurso(n.vencimientogestionduelo) : null,
      cursos_3_anios_fecha_venc:   n.aplicacurso3anos ? (n.vigenciacurso3anos || null) : null,
      cursos_3_anios_estado:       n.aplicacurso3anos ? getEstadoCurso(n.vigenciacurso3anos) : null,
    };

    const accesosPayload = {
      induccion_medica_fsfb:  c.induccionmedicahsm   || null,
      induccion_medica_chsm:  c.induccionmedicachsm  || null,
      induccion_general_chsm: c.inducciongeneralchsm || null,
      induccion_his_isis:     c.induccionhisisis     || null,
      perfil_cargo:           c.perfilcargo          || null,
      entrenamiento:          c.entrenamiento        || null,
      estado_codigo:          c.estadocodigo         || null,
      codigo_smm:             c.codigo               || null,
      estado_carnet:          c.estadocarnet         || null,
      tarjeta_acceso:         c.tarjetaacceso        || null,
      estado_bata:            c.estadobata           || null,
      entrega_almera:         c.entregaalmera        || null,
      entrega_ruaf:           c.entregaruaf          || null,
      mipres:                 c.mipres               || null,
      correo_corporativo:     c.correocorp           || null,
      radio_expuesto:         c.radioexpuesto        || null,
      carta_turnos:           c.cartaturnos          || null,
      inspektor:              c.inspekor             || null,
    };

    const contratacionPayload = {
      tipo_vinculacion:       c.tipovinculacion           || null,
      estado_contrato:        c.estadocontratolaboral     || null,
      jornada:                c.jornadalaboralcontrato ? Number(c.jornadalaboralcontrato) : null,
      tipo_contrato:          c.tipocontrato              || null,
      fecha_firma_contrato:   c.fechafirmacontratacion    || null,
      condiciones_contrato:   c.condicionescontratacion   || null,
      estado_oferta:          c.estadoofertamercantil     || null,
      tipo_persona:           c.persona                   || null,
      fecha_firma_oferta:     c.fechafirmaofertamercantil || null,
      fecha_venc_oferta:      c.fechavencimientoofertamercantil || null,
      modalidad_honorarios:   c.modalidadhorario          || null,
      condiciones_especiales: c.ofertacondicionesespeciales || null,
    };

    await Promise.all([
      upsert(`/medicos/${medicoDoc}/normativos/`,   normPayload),
      upsert(`/medicos/${medicoDoc}/accesos/`,      accesosPayload),
      upsert(`/medicos/${medicoDoc}/contratacion/`, contratacionPayload),
    ]);

    setDirty(false);
    markCompleted?.(4);
  };

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    save:    saveData,
  }));

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await saveData();
      onNext?.();
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 100px)' }}>
      <div style={{ flex:1, padding:'3rem 2.5rem', maxWidth:1620, margin:'0 auto', width:'100%' }}>

        <div style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'var(--color-primary)', letterSpacing:'-0.01em' }}>
            Contratación y Normativos
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:4 }}>
            Vínculo contractual · Normativos y cursos obligatorios · Inducciones y accesos institucionales
          </p>
        </div>

        {loading && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(26,78,215,0.05)', border:'1px solid rgba(26,78,215,0.12)', borderRadius:10, marginBottom:16 }}>
            <span className="material-symbols-outlined sm" style={{ color:'var(--color-primary)', animation:'spin 1s linear infinite' }}>progress_activity</span>
            <span style={{ fontSize:'0.875rem', color:'var(--color-primary)', fontWeight:500 }}>Cargando datos…</span>
          </div>
        )}

        {error && (
          <div role="alert" style={{ background:'rgba(186,26,26,0.07)', border:'1px solid rgba(186,26,26,0.25)', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', gap:10 }}>
            <span className="material-symbols-outlined" style={{ color:'var(--color-error)', flexShrink:0 }}>error</span>
            <p style={{ fontSize:'0.875rem', color:'var(--color-error)', fontWeight:500 }}>{String(error)}</p>
          </div>
        )}

        {/* ═══ SECCIÓN 1 — CONTRATACIÓN ═══ */}
        <SectionCard title="Contratación" icon="handshake" defaultOpen={true}>
          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>VÍNCULO CONTRACTUAL</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:20 }}>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Tipo vinculación" value={contratacion.tipovinculacion}
                onChange={e => chgCont('tipovinculacion', e.target.value)} options={OPTCONTRATO} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Estado contrato laboral" value={contratacion.estadocontratolaboral}
                onChange={e => chgCont('estadocontratolaboral', e.target.value)} options={OPTESTADO} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Tipo contrato" value={contratacion.tipocontrato}
                onChange={e => chgCont('tipocontrato', e.target.value)} options={TCONTRATO} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <CampoFechaNullable label="Fecha firma contratación"
                fieldKey="fechafirmacontratacion" value={contratacion.fechafirmacontratacion} onChangeFn={chgCont} />
            </div>
            <div style={{ flex:'1 1 240px' }}>
              <SimpleSelect label="Condiciones contratación" value={contratacion.condicionescontratacion}
                onChange={e => chgCont('condicionescontratacion', e.target.value)} options={CONTRATOCONDICIONES}  />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <SimpleSelect label="Modalidad honorarios" value={contratacion.modalidadhorario}
                onChange={e => chgCont('modalidadhorario', e.target.value)} options={MCONTRATO}/>
            </div>
          </div>
          {/* Adjuntos vínculo contractual — máx. 5 */}
          <div style={{ marginTop: 4, marginBottom: 20 }}>
            <FileUploadField
              carpeta="contratacion"
              maxArchivos={5}
              medicoDoc={medicoDoc}
              campoRef="vinculo_contractual"
              label="Documentos vínculo contractual (máx. 5 PDF)"
            />
          </div>

          {/* ─── OFERTA MERCANTIL: visible solo cuando el tipo lo requiere ─── */}
          {['OFERTA MERCANTIL', 'LABORAL/OFERTA MERCANTIL'].includes(contratacion.tipovinculacion) && (
            <>
              <div style={{ height:1, background:'rgba(26,78,215,0.07)', margin:'4px 0 16px' }} />
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>OFERTA MERCANTIL</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)' }}>
                <div style={{ flex:'1 1 200px' }}>
                  <SimpleSelect label="Estado oferta mercantil" value={contratacion.estadoofertamercantil}
                    onChange={e => chgCont('estadoofertamercantil', e.target.value)} options={OPTESTADO} />
                </div>
                <div style={{ flex:'1 1 160px' }}>
                  <SimpleSelect label="Tipo persona" value={contratacion.persona}
                    onChange={e => chgCont('persona', e.target.value)}
                    options={[{ value:'', label:'Seleccionar' }, { value:'NATURAL', label:'Natural' }, { value:'JURIDICA', label:'Jurídica' }]} />
                </div>
                <div style={{ flex:'1 1 180px' }}>
                  <CampoFechaNullable label="Firma oferta mercantil"
                    fieldKey="fechafirmaofertamercantil" value={contratacion.fechafirmaofertamercantil} onChangeFn={chgCont} />
                </div>
                <div style={{ flex:'1 1 180px' }}>
                  <CampoFechaNullable label="Vencimiento oferta mercantil"
                    fieldKey="fechavencimientoofertamercantil" value={contratacion.fechavencimientoofertamercantil} onChangeFn={chgCont} />
                </div>
                <div style={{ flex:'1 1 180px' }}>
                  <CampoFechaNullable label="Fecha acep. pre-legal"
                    fieldKey="fechafirmaacepprelegal" value={contratacion.fechafirmaacepprelegal} onChangeFn={chgCont} />
                </div>
              </div>

              {/* Vigencia card oferta mercantil */}
              {contratacion.fechavencimientoofertamercantil && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, padding:'8px 14px', borderRadius:10, background:'rgba(26,78,215,0.04)', border:'1px solid rgba(26,78,215,0.10)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:17, color:'var(--color-secondary)' }}>event_available</span>
                  <span style={{ fontSize:'0.8125rem', color:'#475569', fontWeight:500 }}>Vigencia oferta mercantil:</span>
                  <VigenciaOferta fecha={contratacion.fechavencimientoofertamercantil} />
                </div>
              )}

              {/* Adjunto oferta mercantil */}
              <div style={{ marginTop:14 }}>
                <FileUploadField
                  carpeta="contratacion"
                  maxArchivos={1}
                  medicoDoc={medicoDoc}
                  campoRef="oferta_mercantil"
                  label="Documento oferta mercantil (PDF)"
                />
              </div>
            </>
          )}
        </SectionCard>

        {/* ═══ SECCIÓN 2 — NORMATIVOS Y CURSOS ═══ */}
        <SectionCard title="Normativos y Cursos" icon="policy" defaultOpen={false}>

          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>RESOLUCIONES</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:12, marginBottom:24 }}>
            {RESOLUCIONES.map(res => (
              <CursoCard
                key={res.key}
                curso={res}
                aplica={!!normativos[`aplica${res.key}`]}
                vencimiento={normativos[`vencimiento${res.key}`]}
                onChange={(field, val) => chgNorm(field, val)}
                medicoDoc={medicoDoc}
              />
            ))}
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>CURSOS OBLIGATORIOS — NORMA Y VENCIMIENTO</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, background: 'rgba(10,92,153,0.08)', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary,#0A5C99)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>toggle_on</span>
              Activa los que aplican
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {CURSOS.map(c => (
              <CursoCard key={c.key} curso={c}
                aplica={!!normativos[`aplica${c.key}`]}
                vencimiento={normativos[vKey(c.key)]}
                onChange={chgNorm}
                medicoDoc={medicoDoc} />
            ))}
          </div>
        </SectionCard>

        {/* ═══ SECCIÓN 3 — INDUCCIONES Y ACCESOS ═══ */}
        <SectionCard title="Inducciones y Accesos" icon="how_to_reg" defaultOpen={false}>

          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>INDUCCIONES</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:20 }}>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Inducción médica HSM" value={contratacion.induccionmedicahsm}
                onChange={e => chgCont('induccionmedicahsm', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Inducción Médica FSFB" value={contratacion.induccionmedicachsm}
                onChange={e => chgCont('induccionmedicachsm', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Inducción general HSM" value={contratacion.inducciongeneralchsm}
                onChange={e => chgCont('inducciongeneralchsm', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Inducción HISISIS" value={contratacion.induccionhisisis}
                onChange={e => chgCont('induccionhisisis', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Perfil cargo" value={contratacion.perfilcargo}
                onChange={e => chgCont('perfilcargo', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Entrenamiento" value={contratacion.entrenamiento}
                onChange={e => chgCont('entrenamiento', e.target.value)} options={OPTSINO} />
            </div>
          </div>

          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>EQUIPOS Y ACCESOS</p>
          <div style={{ display: 'flex', flexWrap: 'Wrap', gap:'var(--space-4)', marginBottom:20 }}>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Estado código" value={contratacion.estadocodigo}
                onChange={e => chgCont('estadocodigo', e.target.value)} options={OPTESTADO} />
            </div>
            <div style={{ flex:'1 1 140px' }}>
              <SimpleInput label="Código" value={contratacion.codigo}
                onChange={e => chgCont('codigo', e.target.value)} placeholder="Código asignado" />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Estado carnet" value={contratacion.estadocarnet}
                onChange={e => chgCont('estadocarnet', e.target.value)} options={OPTESTADO} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Tarjeta acceso" value={contratacion.tarjetaacceso}
                onChange={e => chgCont('tarjetaacceso', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Estado bata" value={contratacion.estadobata}
                onChange={e => chgCont('estadobata', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 140px' }}>
              <SimpleSelect label="Entrega ALMERA" value={contratacion.entregaalmera}
                onChange={e => chgCont('entregaalmera', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 140px' }}>
              <SimpleSelect label="Entrega RUAF" value={contratacion.entregaruaf}
                onChange={e => chgCont('entregaruaf', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 140px' }}>
              <SimpleSelect label="MIPRES" value={contratacion.mipres}
                onChange={e => chgCont('mipres', e.target.value)} options={OPTSINO} />
            </div>
            
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Radio expuesto" value={contratacion.radioexpuesto}
                onChange={e => chgCont('radioexpuesto', e.target.value)} options={OPTSINONA} />
            </div>
           
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="INSPEKTOR" value={contratacion.inspekor}
                onChange={e => chgCont('inspekor', e.target.value)} options={OPTSINONA} />
            </div>
          </div>

        </SectionCard>

      </div>

      {/* ── Footer ── */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={onPrev} disabled={saving}>
          <span className="material-symbols-outlined sm">arrow_back</span>
          Académica y Habilitación
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, minHeight:'inherit' }}>
          {saving && (
            <span style={{ fontSize:'0.8125rem', color:'var(--color-on-surface-variant)', display:'flex', alignItems:'center', gap:6 }}>
              <span className="material-symbols-outlined sm" style={{ animation:'spin 1s linear infinite' }}>progress_activity</span>
              Guardando
            </span>
          )}
          <button className="btn btn-signature" onClick={handleSave} disabled={saving || loading}>
            Guardar y continuar
            <span className="material-symbols-outlined sm">arrow_forward</span>
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {pendingDeactivation && (
        <CredentialModal
          title="Autorizar desactivación"
          description={`Estás por desactivar el normativo "${pendingDeactivation.cursoLabel}". Esto limpiará su fecha de vencimiento y estado. Ingresa credenciales de Administrador o Supervisor para confirmar.`}
          icon="toggle_off"
          iconColor="#92400E"
          iconBg="rgba(146,64,14,0.08)"
          confirmLabel="Autorizar desactivación"
          confirmColor="#92400E"
          onClose={() => setPendingDeactivation(null)}
          onSuccess={() => {
            const field = pendingDeactivation.field;
            setPendingDeactivation(null);
            setNormativos(p => ({ ...p, [field]: false }));
          }}
        />
      )}
    </div>
  );
});

export default Tab4Institucional;
