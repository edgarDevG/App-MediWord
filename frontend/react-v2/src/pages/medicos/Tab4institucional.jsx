import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

/* ── Helpers ── */
const toDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

/* ── Opciones ── */
const OPTSINO    = [{ value: '', label: 'Seleccionar' }, { value: 'SI', label: 'Sí' }, { value: 'NO', label: 'No' }, { value: 'PENDIENTE', label: 'Pendiente' }];
const OPTSINONA  = [{ value: '', label: 'Seleccionar' }, { value: 'SI', label: 'Sí' }, { value: 'NO', label: 'No' }, { value: 'NA', label: 'N/A' }];
const OPTESTADO  = [{ value: '', label: 'Seleccionar' }, { value: 'ACTIVO', label: 'Activo' }, { value: 'VENCIDO', label: 'Vencido' }, { value: 'PENDIENTE', label: 'Pendiente' }, { value: 'NA', label: 'N/A' }];
const OPTCONTRATO= [{ value: '', label: 'Seleccionar' }, { value: 'LABORAL', label: 'Laboral' }, { value: 'PRESTACION', label: 'Prestación de Servicios' }, { value: 'OFERTA', label: 'Oferta Mercantil' }, { value: 'NA', label: 'N/A' }];

/* ── Cursos normativos ── */
const CURSOS = [
  { key: 'bls',                   label: 'BLS'                        },
  { key: 'acls',                  label: 'ACLS'                       },
  { key: 'pals',                  label: 'PALS'                       },
  { key: 'nals',                  label: 'NALS'                       },
  { key: 'violenciasexual',       label: 'Violencia Sexual'           },
  { key: 'ataquesagentesquimicos',label: 'Agentes Químicos'           },
  { key: 'dengue',                label: 'Dengue'                     },
  { key: 'sedacion',              label: 'Sedación'                   },
  { key: 'cuidadodonanteins',     label: 'Gestión Operativa Donante'  },
  { key: 'radioproteccion',       label: 'Radioprotección'            },
  { key: 'manejodolor',           label: 'Manejo del Dolor'           },
  { key: 'iamii',                 label: 'IAMII'                      },
  { key: 'gestionduelo',          label: 'Gestión del Duelo'          },
  { key: 'curso3anos',            label: 'Curso 3 Años'               },
];

const vKey = (key) => key === 'curso3anos' ? 'vigenciacurso3anos' : `vencimiento${key}`;

/* ── Estados iniciales ── */
const buildInitNormativos = () => {
  const init = {
    resolejercicioplaza: '', resolanastesiologo: '',
    tarjetarethus: '', consultarethus: '', tituloconsultarethus: '',
    formmanejodolor: '',
    polizaresponsabilidadcivil: '', vencimientopolizarespcivil: null,
    polizacomplicaciones: '', anosenelhospital: '',
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
  polizrespcivil: '', vencimientopolizrespcivil: null,
  polizacomplicacionescont: '', anosenelhospitalcont: '',
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

function ToggleCurso({ label, keyName, aplica, norma, vencimiento, onChange }) {
  return (
    <div style={{ background: aplica ? 'rgba(26,78,215,0.04)' : 'rgba(148,163,184,0.06)', border:`1.5px solid ${aplica ? 'rgba(26,78,215,0.18)' : 'rgba(148,163,184,0.18)'}`, borderRadius:10, padding:'10px 14px', transition:'all 200ms' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: aplica ? 10 : 0 }}>
        <span style={{ fontSize:'0.8125rem', fontWeight:600, color: aplica ? 'var(--color-primary,#1a4ed7)' : '#64748b', transition:'color 200ms' }}>{label}</span>
        <button type="button" onClick={() => onChange(`aplica${keyName}`, !aplica)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 10px 3px 6px', borderRadius:9999, border:'none', cursor:'pointer', background: aplica ? 'rgba(26,78,215,0.10)' : 'rgba(148,163,184,0.12)', transition:'all 180ms' }}>
          <div style={{ width:28, height:16, borderRadius:8, background: aplica ? 'var(--color-primary,#1a4ed7)' : '#cbd5e1', position:'relative', transition:'background 200ms', flexShrink:0 }}>
            <div style={{ position:'absolute', top:2, left: aplica ? 14 : 2, width:12, height:12, borderRadius:'50%', background:'white', transition:'left 180ms cubic-bezier(0.16,1,0.3,1)', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ fontSize:'0.6875rem', fontWeight:700, color: aplica ? 'var(--color-primary,#1a4ed7)' : '#94a3b8' }}>{aplica ? 'Aplica' : 'N/A'}</span>
        </button>
      </div>
      {aplica && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 120px' }}>
            <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Norma</label>
            <input type="text" className="form-input" style={{ fontSize:'0.8125rem', padding:'6px 10px' }}
              value={norma ?? ''} placeholder="Ej. Res. 123/2023"
              onChange={e => onChange(`norma${keyName}`, e.target.value)} />
          </div>
          <div style={{ flex:'1 1 140px' }}>
            <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Vencimiento</label>
            <input type="date" className="form-input" style={{ fontSize:'0.8125rem', padding:'6px 10px' }}
              value={vencimiento ?? ''}
              onChange={e => onChange(vKey(keyName), e.target.value || null)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — Tab4: Contratación y Normativos
   ══════════════════════════════════════════════════════════════ */
export default function Tab4Institucional({ medicoDoc, onNext, onPrev, markCompleted }) {
  const [normativos,   setNormativos]   = useState(buildInitNormativos);
  const [contratacion, setContratacion] = useState(buildInitContratacion);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);

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
          resolejercicioplaza:      dNorm.res_ejercicio     ?? '',
          resolanastesiologo:       dNorm.res_anestesiologo ?? '',
          tarjetarethus:            dNorm.tarjeta_rethus    ?? '',
          consultarethus:           dNorm.consulta_rethus   ?? '',
          tituloconsultarethus:     dNorm.titulos_rethus    ?? '',
          polizaresponsabilidadcivil: dAcc.poliza_resp_civil   ?? '',
          vencimientopolizarespcivil: toDate(dAcc.fecha_venc_poliza),
          polizacomplicaciones:       dAcc.poliza_complicaciones ?? '',

          aplicabls:                !!dNorm.bls_fecha_venc,               vencimientobls:                toDate(dNorm.bls_fecha_venc),
          aplicaacls:               !!dNorm.acls_fecha_venc,              vencimientoacls:               toDate(dNorm.acls_fecha_venc),
          aplicapals:               !!dNorm.pals_fecha_venc,              vencimientopals:               toDate(dNorm.pals_fecha_venc),
          aplicanals:               !!dNorm.nals_fecha_venc,              vencimientonals:               toDate(dNorm.nals_fecha_venc),
          aplicaviolenciasexual:    !!dNorm.violencia_sexual_fecha,       vencimientoviolenciasexual:    toDate(dNorm.violencia_sexual_fecha),
          aplicaataquesagentesquimicos: !!dNorm.ataques_quimicos_fecha,   vencimientoataquesagentesquimicos: toDate(dNorm.ataques_quimicos_fecha),
          aplicadengue:             !!dNorm.dengue_fecha,                 vencimientodengue:             toDate(dNorm.dengue_fecha),
          aplicasedacion:           !!dNorm.sedacion_fecha,               vencimientosedacion:           toDate(dNorm.sedacion_fecha),
          aplicamanejodolor:        !!dNorm.manejo_dolor_fecha,           vencimientomanejodolor:        toDate(dNorm.manejo_dolor_fecha),
          aplicaradioproteccion:    !!dNorm.radioproteccion_fecha,        vencimientoradioproteccion:    toDate(dNorm.radioproteccion_fecha),
          aplicaiamii:              !!dNorm.iamii_fecha,                  vencimientoiamii:              toDate(dNorm.iamii_fecha),
          aplicagestionduelo:       !!dNorm.gestion_duelo_fecha,          vencimientogestionduelo:       toDate(dNorm.gestion_duelo_fecha),
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
          induccionhisisis:     dAcc.induccion_his_isis     ?? '',
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
          polizrespcivil:       dAcc.poliza_resp_civil      ?? '',
          vencimientopolizrespcivil: toDate(dAcc.fecha_venc_poliza),
          polizacomplicacionescont:  dAcc.poliza_complicaciones ?? '',
        }));

      } catch (e) {
        console.error('Tab4 load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [medicoDoc]);

  /* ── Handlers ── */
  const chgNorm = (field, value) => setNormativos(p   => ({ ...p, [field]: value }));
  const chgCont = (field, value) => setContratacion(p => ({ ...p, [field]: value }));

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

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const n = normativos;
      const c = contratacion;

      const normPayload = {
        res_ejercicio:        n.resolejercicioplaza     || null,
        res_anestesiologo:    n.resolanastesiologo      || null,
        tarjeta_rethus:       n.tarjetarethus           || null,
        consulta_rethus:      n.consultarethus          || null,
        titulos_rethus:       n.tituloconsultarethus    || null,
        bls_fecha_venc:       n.vencimientobls          || null,
        acls_fecha_venc:      n.vencimientoacls         || null,
        pals_fecha_venc:      n.vencimientopals         || null,
        nals_fecha_venc:      n.vencimientonals         || null,
        violencia_sexual_fecha:      n.vencimientoviolenciasexual       || null,
        ataques_quimicos_fecha:      n.vencimientoataquesagentesquimicos || null,
        dengue_fecha:                n.vencimientodengue                || null,
        sedacion_fecha:              n.vencimientosedacion              || null,
        manejo_dolor_fecha:          n.vencimientomanejodolor           || null,
        radioproteccion_fecha:       n.vencimientoradioproteccion       || null,
        iamii_fecha:                 n.vencimientoiamii                 || null,
        gestion_duelo_fecha:         n.vencimientogestionduelo          || null,
      };

      const accesosPayload = {
        induccion_medica_fsfb:  c.induccionmedicahsm  || null,
        induccion_medica_chsm:  c.induccionmedicachsm || null,
        induccion_general_chsm: c.inducciongeneralchsm || null,
        induccion_his_isis:     c.induccionhisisis    || null,
        perfil_cargo:           c.perfilcargo         || null,
        entrenamiento:          c.entrenamiento       || null,
        estado_codigo:          c.estadocodigo        || null,
        codigo_smm:             c.codigo              || null,
        estado_carnet:          c.estadocarnet        || null,
        tarjeta_acceso:         c.tarjetaacceso       || null,
        estado_bata:            c.estadobata          || null,
        entrega_almera:         c.entregaalmera       || null,
        entrega_ruaf:           c.entregaruaf         || null,
        mipres:                 c.mipres              || null,
        correo_corporativo:     c.correocorp          || null,
        radio_expuesto:         c.radioexpuesto       || null,
        carta_turnos:           c.cartaturnos         || null,
        poliza_resp_civil:      c.polizrespcivil      || n.polizaresponsabilidadcivil || null,
        fecha_venc_poliza:      c.vencimientopolizrespcivil || n.vencimientopolizarespcivil || null,
        poliza_complicaciones:  c.polizacomplicacionescont  || n.polizacomplicaciones       || null,
      };

      const contratacionPayload = {
        tipo_vinculacion:    c.tipovinculacion        || null,
        estado_contrato:     c.estadocontratolaboral  || null,
        jornada:             c.jornadalaboralcontrato ? Number(c.jornadalaboralcontrato) : null,
        tipo_contrato:       c.tipocontrato           || null,
        fecha_firma_contrato:   c.fechafirmacontratacion      || null,
        condiciones_contrato:   c.condicionescontratacion     || null,
        estado_oferta:          c.estadoofertamercantil       || null,
        tipo_persona:           c.persona                     || null,
        fecha_firma_oferta:     c.fechafirmaofertamercantil   || null,
        fecha_venc_oferta:      c.fechavencimientoofertamercantil || null,
        modalidad_honorarios:   c.modalidadhorario            || null,
        condiciones_especiales: c.ofertacondicionesespeciales || null,
      };

      await Promise.all([
        upsert(`/medicos/${medicoDoc}/normativos/`,   normPayload),
        upsert(`/medicos/${medicoDoc}/accesos/`,      accesosPayload),
        upsert(`/medicos/${medicoDoc}/contratacion/`, contratacionPayload),
      ]);

      markCompleted?.(4);
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
                onChange={e => chgCont('tipocontrato', e.target.value)} options={OPTCONTRATO} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <CampoFechaNullable label="Fecha firma contratación"
                fieldKey="fechafirmacontratacion" value={contratacion.fechafirmacontratacion} onChangeFn={chgCont} />
            </div>
            <div style={{ flex:'1 1 240px' }}>
              <SimpleInput label="Condiciones contratación" value={contratacion.condicionescontratacion}
                onChange={e => chgCont('condicionescontratacion', e.target.value)} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <SimpleInput label="Modalidad honorarios" value={contratacion.modalidadhorario}
                onChange={e => chgCont('modalidadhorario', e.target.value)} />
            </div>
          </div>

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
            <div style={{ flex:'1 1 260px' }}>
              <SimpleInput label="Condiciones especiales oferta" value={contratacion.ofertacondicionesespeciales}
                onChange={e => chgCont('ofertacondicionesespeciales', e.target.value)} />
            </div>
          </div>
        </SectionCard>

        {/* ═══ SECCIÓN 2 — NORMATIVOS Y CURSOS ═══ */}
        <SectionCard title="Normativos y Cursos" icon="policy" defaultOpen={false}>

          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>RESOLUCIONES Y RETHUS</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:24 }}>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Resol. ejercicio plaza" value={normativos.resolejercicioplaza}
                onChange={e => chgNorm('resolejercicioplaza', e.target.value)} options={OPTSINONA} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Resol. anestesiólogo" value={normativos.resolanastesiologo}
                onChange={e => chgNorm('resolanastesiologo', e.target.value)} options={OPTSINONA} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <SimpleSelect label="Tarjeta RETHUS" value={normativos.tarjetarethus}
                onChange={e => chgNorm('tarjetarethus', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <SimpleSelect label="Consulta RETHUS" value={normativos.consultarethus}
                onChange={e => chgNorm('consultarethus', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 260px' }}>
              <SimpleInput label="Título consulta RETHUS" value={normativos.tituloconsultarethus}
                onChange={e => chgNorm('tituloconsultarethus', e.target.value)} placeholder="Texto del título consultado" />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <SimpleSelect label="Form. manejo del dolor" value={normativos.formmanejodolor}
                onChange={e => chgNorm('formmanejodolor', e.target.value)} options={OPTSINONA} />
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em' }}>CURSOS OBLIGATORIOS — NORMA Y VENCIMIENTO</p>
            <div style={{ padding:'2px 8px', borderRadius:9999, background:'rgba(26,78,215,0.08)', fontSize:'0.6875rem', fontWeight:700, color:'var(--color-primary,#1a4ed7)' }}>
              Activa los que aplican
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
            {CURSOS.map(c => (
              <ToggleCurso key={c.key} keyName={c.key} label={c.label}
                aplica={!!normativos[`aplica${c.key}`]}
                norma={normativos[`norma${c.key}`]}
                vencimiento={normativos[vKey(c.key)]}
                onChange={chgNorm} />
            ))}
          </div>

          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', margin:'20px 0 12px' }}>PÓLIZAS</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)' }}>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Póliza resp. civil" value={normativos.polizaresponsabilidadcivil}
                onChange={e => chgNorm('polizaresponsabilidadcivil', e.target.value)} options={OPTSINONA} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <div className="form-group">
                <label className="form-label">Vencimiento póliza</label>
                <input type="date" className="form-input" value={normativos.vencimientopolizarespcivil ?? ''}
                  onChange={e => chgNorm('vencimientopolizarespcivil', e.target.value || null)} />
              </div>
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Póliza complicaciones" value={normativos.polizacomplicaciones}
                onChange={e => chgNorm('polizacomplicaciones', e.target.value)} options={OPTSINONA} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleInput label="Años en el hospital" value={normativos.anosenelhospital}
                onChange={e => chgNorm('anosenelhospital', e.target.value)} placeholder="Ej. 3" />
            </div>
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
              <SimpleSelect label="Inducción médica CHSM" value={contratacion.induccionmedicachsm}
                onChange={e => chgCont('induccionmedicachsm', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Inducción general CHSM" value={contratacion.inducciongeneralchsm}
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
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginBottom:20 }}>
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
                onChange={e => chgCont('estadobata', e.target.value)} options={OPTESTADO} />
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
              <SimpleSelect label="Correo corporativo" value={contratacion.correocorp}
                onChange={e => chgCont('correocorp', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Radio expuesto" value={contratacion.radioexpuesto}
                onChange={e => chgCont('radioexpuesto', e.target.value)} options={OPTSINONA} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="Carta turnos" value={contratacion.cartaturnos}
                onChange={e => chgCont('cartaturnos', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <SimpleSelect label="INSPEKOR" value={contratacion.inspekor}
                onChange={e => chgCont('inspekor', e.target.value)} options={OPTSINONA} />
            </div>
          </div>

          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', marginBottom:12 }}>PÓLIZAS (ACCESOS)</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)' }}>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Póliza resp. civil" value={contratacion.polizrespcivil}
                onChange={e => chgCont('polizrespcivil', e.target.value)} options={OPTSINONA} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <CampoFechaNullable label="Vencimiento póliza"
                fieldKey="vencimientopolizrespcivil" value={contratacion.vencimientopolizrespcivil} onChangeFn={chgCont} />
            </div>
            <div style={{ flex:'1 1 200px' }}>
              <SimpleSelect label="Póliza complicaciones" value={contratacion.polizacomplicacionescont}
                onChange={e => chgCont('polizacomplicacionescont', e.target.value)} options={OPTSINONA} />
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
    </div>
  );
}