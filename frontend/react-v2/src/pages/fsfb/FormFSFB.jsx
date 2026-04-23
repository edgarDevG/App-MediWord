/* ═══════════════════════════════════════════════════════════════
   FormFSFB.jsx v3 — Médico FSFB · MediWord HSM
   Tabs: Datos Personales | Contratación y Accesos | Normatividad
   Endpoints: /medicos/ + /contacto/ + /accesos/ + /normativos/ + /contratacion/
══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../components/Toast';
import '../medicos/FormMedico.css';

/* ── Opciones constantes ──────────────────────────────────── */
const OPT_SNA  = [{ value:'SI', label:'Sí' }, { value:'NO', label:'No' }, { value:'N/A', label:'N/A' }];
const OPT_EST  = [{ value:'VIGENTE', label:'Vigente' }, { value:'VENCIDO', label:'Vencido' }, { value:'PENDIENTE', label:'Pendiente' }, { value:'N/A', label:'N/A' }];
const OPT_TIPO_DOC = [{ value:'CC', label:'C.C.' }, { value:'CE', label:'C.E.' }, { value:'PA', label:'Pasaporte' }, { value:'PEP', label:'PEP' }];
const OPT_SEXO = [{ value:'M', label:'Masculino' }, { value:'F', label:'Femenino' }, { value:'O', label:'Otro' }];
const OPT_VIN  = [
  { value:'Contrato laboral',  label:'Contrato laboral'  },
  { value:'Prestación servicios', label:'Prestación servicios' },
  { value:'FSFB',              label:'FSFB'              },
];

const CURSOS = [
  { label:'BLS',             fecha:'bls_fecha_venc',         estado:'bls_estado'              },
  { label:'ACLS',            fecha:'acls_fecha_venc',        estado:'acls_estado'             },
  { label:'PALS',            fecha:'pals_fecha_venc',        estado:'pals_estado'             },
  { label:'NALS',            fecha:'nals_fecha_venc',        estado:'nals_estado'             },
  { label:'Radioprotección', fecha:'radioproteccion_fecha',  estado:'radioproteccion_estado'  },
  { label:'Violencia Sexual',fecha:'violencia_sexual_fecha', estado:'violencia_sexual_estado' },
  { label:'Ag. Químicos',    fecha:'ataques_quimicos_fecha', estado:'ataques_quimicos_estado' },
  { label:'Dengue',          fecha:'dengue_fecha',           estado:'dengue_estado'           },
  { label:'AIEPI',           fecha:'aiepi_fecha',            estado:'aiepi_estado'            },
  { label:'Sedación',        fecha:'sedacion_fecha',         estado:'sedacion_estado'         },
  { label:'Manejo Dolor',    fecha:'manejo_dolor_fecha',     estado:'manejo_dolor_estado'     },
  { label:'Gest. Donante',   fecha:'gestion_donante_fecha',  estado:'gestion_donante_estado'  },
  { label:'Gest. Duelo',     fecha:'gestion_duelo_fecha',    estado:'gestion_duelo_estado'    },
  { label:'IAMII',           fecha:'iamii_fecha',            estado:'iamii_estado'            },
  { label:'Telemedicina',    fecha:'telemedicina_fecha',     estado:'telemedicina_estado'     },
];

const ESTADO_COLOR = {
  'OK':         { bg:'#dcfce7', color:'#166534' },
  'Por vencer': { bg:'#fef9c3', color:'#854d0e' },
  'Vencido':    { bg:'#fee2e2', color:'#991b1b' },
  'VIGENTE':    { bg:'#dcfce7', color:'#166534' },
  'VENCIDO':    { bg:'#fee2e2', color:'#991b1b' },
  'PENDIENTE':  { bg:'#fef9c3', color:'#854d0e' },
};

const toDate  = (v) => (!v ? '' : String(v).slice(0, 10));

const INIT_MED  = { primer_nombre:'', segundo_nombre:'', primer_apellido:'', segundo_apellido:'', categoria:'', especialidad:'', anios_cuerpo_medico:'' };
const INIT_CONT = { correo:'', celular:'', telefono:'', direccion_correspondencia:'', direccion_consultorio:'', tipo_documento:'', lugar_expedicion:'', fecha_nacimiento:'', lugar_nacimiento:'', sexo:'', maneja_lengua_senas:false, idioma_ingles:'', idioma_frances:'', idioma_aleman:'', idioma_portugues:'', idioma_italiano:'', idioma_otro:'' };
const INIT_VIN  = { tipo_vinculacion:'', estado_contrato:'', modalidad_honorarios:'', tiempo_laborado:'' };
const INIT_ACC  = { induccion_medica_fsfb:'', induccion_medica_chsm:'', induccion_general_chsm:'', induccion_his_isis:'', perfil_cargo:'', entrenamiento:'', estado_codigo:'', codigo_smm:'', estado_carnet:'', tarjeta_acceso:'', estado_bata:'', entrega_almera:'', entrega_ruaf:'', mipres:'', correo_corporativo:'', radio_expuesto:'', carta_turnos:'', poliza_resp_civil:'', fecha_venc_poliza:'', poliza_complicaciones:'' };
const INIT_NORM = { ...Object.fromEntries(CURSOS.flatMap(c => [[c.fecha,''], [c.estado,'']])), cursos_3_anios:'' };

/* ── UI helpers ─────────────────────────────────────────── */
function Campo({ label, name, value, onChange, error, required, placeholder, type='text', disabled, span }) {
  return (
    <div className="form-group fm-field" style={span ? { gridColumn:`span ${span}` } : {}}>
      <label className={`form-label${required?' required':''}`} htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className={`form-input fm-input${error?' error':''}`}
        value={value??''} onChange={onChange} placeholder={placeholder??''} disabled={disabled} />
      {error && <span className="form-hint fm-error"><span className="material-symbols-outlined" style={{fontSize:'0.875rem'}}>error</span>{error}</span>}
    </div>
  );
}

function CampoSelect({ label, name, value, onChange, options=[], placeholder, required, disabled, span }) {
  return (
    <div className="form-group fm-field" style={span ? { gridColumn:`span ${span}` } : {}}>
      <label className={`form-label${required?' required':''}`} htmlFor={name}>{label}</label>
      <div className="fm-select-wrap">
        <select id={name} name={name} className="form-select fm-select" value={value??''} onChange={onChange} disabled={disabled}>
          <option value="">{placeholder??'Seleccionar…'}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="material-symbols-outlined fm-select-arrow" style={{fontSize:'1.125rem'}}>expand_more</span>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="fm-section-card">
      <div className="fm-section-header">
        <span className="material-symbols-outlined fm-section-icon">{icon}</span>
        <span className="fm-section-title" style={{fontSize:'0.875rem',fontWeight:700}}>{title}</span>
      </div>
      <div style={{padding:'1.25rem'}}>{children}</div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────── */
export default function FormFSFB() {
  const navigate = useNavigate();
  const { documento } = useParams();
  const { showToast, ToastContainer } = useToast();
  const isEdit = Boolean(documento);

  const [tab,     setTab]     = useState(0);
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

  useEffect(() => {
    axiosInstance.get('/maestras/categorias-metricas', { skipToast:true }).then(r => setRawCats(r.data??[])).catch(()=>{});
    if (!isEdit) return;

    (async () => {
      try {
        const [rM, rCt, rVin, rAcc, rN] = await Promise.allSettled([
          axiosInstance.get(`/medicos/${documento}/`,             { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/contacto/`,    { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/contratacion/`,{ skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/accesos/`,     { skipToast:true }),
          axiosInstance.get(`/medicos/${documento}/normativos/`,  { skipToast:true }),
        ]);
        if (rM.status==='fulfilled') {
          const m = rM.value.data??{};
          setMed({ primer_nombre:m.primer_nombre??'', segundo_nombre:m.segundo_nombre??'', primer_apellido:m.primer_apellido??'', segundo_apellido:m.segundo_apellido??'', categoria:m.categoria??'', especialidad:m.especialidad??'', anios_cuerpo_medico:m.anios_cuerpo_medico??'' });
        }
        if (rCt.status==='fulfilled') {
          const c = rCt.value.data??{};
          setCont(Object.fromEntries(Object.keys(INIT_CONT).map(k => [k, k==='fecha_nacimiento'?toDate(c[k]):(c[k]??'')])));
        }
        if (rVin.status==='fulfilled') {
          const v = rVin.value.data??{};
          setVin(Object.fromEntries(Object.keys(INIT_VIN).map(k => [k, v[k]??''])));
        }
        if (rAcc.status==='fulfilled') {
          const a = rAcc.value.data??{};
          setAcc(Object.fromEntries(Object.keys(INIT_ACC).map(k => [k, k==='fecha_venc_poliza'?toDate(a[k]):(a[k]??'')])));
        }
        if (rN.status==='fulfilled') {
          const n = rN.value.data??{};
          setNorm(Object.fromEntries(Object.keys(INIT_NORM).map(k => [k, (k.endsWith('_fecha')||k.endsWith('_fecha_venc'))?toDate(n[k]):(n[k]??'')])));
        }
      } catch { showToast?.('Error cargando médico FSFB','error'); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  const bind  = (setter) => (e) => setter(p => ({ ...p, [e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

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
      if (isEdit) await axiosInstance.put(`/medicos/${docId}/`, { ...med, tipo_listado:'fsfb_externo', estado:'ACTIVO' });
      else        await axiosInstance.post('/medicos/', { ...med, documento_identidad:docId, tipo_listado:'fsfb_externo', estado:'ACTIVO' });

      await Promise.allSettled([
        upsert(`/medicos/${docId}/contacto/`,     { ...cont, documento_identidad:docId }),
        upsert(`/medicos/${docId}/contratacion/`,  { ...vin,  documento_identidad:docId }),
        upsert(`/medicos/${docId}/accesos/`,       { ...Object.fromEntries(Object.entries(acc).map(([k,v])=>[k,v||null])), documento_identidad:docId }),
        upsert(`/medicos/${docId}/normativos/`,    { ...Object.fromEntries(Object.entries(norm).filter(([k])=>!k.endsWith('_estado')).map(([k,v])=>[k,v||null])), documento_identidad:docId }),
      ]);

      showToast?.('Médico FSFB guardado correctamente','success');
      navigate('/medicos-fsfb');
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al guardar';
      showToast?.(Array.isArray(msg) ? msg.map(m=>m.msg??JSON.stringify(m)).join(' · ') : msg, 'error');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="fm-root"><div className="fm-content">
      {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{height:100,borderRadius:14,marginBottom:12}} />)}
    </div></div>
  );

  /* ── TABS config ─────────────────────────────────────── */
  const TABS = [
    { label:'Datos Personales',       icon:'person'           },
    { label:'Contratación y Accesos', icon:'verified_user'    },
    { label:'Normatividad',           icon:'workspace_premium'},
  ];

  return (
    <div className="fm-root">
      {/* Header */}
      <div className="fm-header">
        <h1 className="fm-title">{isEdit ? 'Editar médico FSFB' : 'Nuevo médico FSFB'}</h1>
        <p className="fm-subtitle">Fundación Santa Fe · Personal externo vinculado</p>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex', gap:0, padding:'0 2rem', borderBottom:'1px solid rgba(197,198,210,0.2)', background:'#fcfcfd', maxWidth:1200, margin:'0 auto', width:'100%', boxSizing:'border-box'}}>
        {TABS.map((t,i) => (
          <button key={i} onClick={()=>setTab(i)} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:'0.8125rem', fontWeight:700,
            color: tab===i ? '#1a4ed7' : '#64748b',
            borderBottom: tab===i ? '2px solid #1a4ed7' : '2px solid transparent',
            transition:'all 150ms',
          }}>
            <span className="material-symbols-outlined" style={{fontSize:16, fontVariationSettings: tab===i ? "'FILL' 1" : "'FILL' 0"}}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="fm-content fm-content-compact fm-animate-in">

        {/* ══ TAB 0: Datos Personales ══════════════════════════ */}
        {tab===0 && (
          <>
            <SectionCard title="Identificación" icon="badge">
              <div className="fm-grid fm-grid-4">
                {!isEdit && (
                  <Campo label="N.° Documento" name="docFsfb" value={docFsfb} onChange={e=>setDocFsfb(e.target.value)} required error={errors.docFsfb} placeholder="Cédula del médico" />
                )}
                <CampoSelect label="Tipo documento" name="tipo_documento" value={cont.tipo_documento} onChange={bind(setCont)} options={OPT_TIPO_DOC} />
                <Campo label="Lugar expedición" name="lugar_expedicion" value={cont.lugar_expedicion} onChange={bind(setCont)} placeholder="Ciudad" />
                <Campo label="Primer nombre"    name="primer_nombre"    value={med.primer_nombre}    onChange={bind(setMed)} required error={errors.primer_nombre}   placeholder="Primer nombre" />
                <Campo label="Segundo nombre"   name="segundo_nombre"   value={med.segundo_nombre}   onChange={bind(setMed)} placeholder="Segundo nombre (opcional)" />
                <Campo label="Primer apellido"  name="primer_apellido"  value={med.primer_apellido}  onChange={bind(setMed)} required error={errors.primer_apellido} placeholder="Primer apellido" />
                <Campo label="Segundo apellido" name="segundo_apellido" value={med.segundo_apellido} onChange={bind(setMed)} placeholder="Segundo apellido (opcional)" />
                <CampoSelect label="Categoría"  name="categoria"        value={med.categoria}        onChange={bind(setMed)} options={optCats} />
                <Campo label="Especialidad"     name="especialidad"     value={med.especialidad}     onChange={bind(setMed)} placeholder="Ej: Anestesiología" />
              </div>
            </SectionCard>

            <SectionCard title="Datos demográficos" icon="person_pin">
              <div className="fm-grid fm-grid-4">
                <Campo label="Fecha de nacimiento" name="fecha_nacimiento" type="date" value={cont.fecha_nacimiento} onChange={bind(setCont)} />
                <Campo label="Lugar de nacimiento" name="lugar_nacimiento" value={cont.lugar_nacimiento} onChange={bind(setCont)} placeholder="Ciudad, Dpto." />
                <CampoSelect label="Sexo" name="sexo" value={cont.sexo} onChange={bind(setCont)} options={OPT_SEXO} />
                <Campo label="Años en hospital" name="anios_cuerpo_medico" type="number" value={med.anios_cuerpo_medico} onChange={bind(setMed)} placeholder="Ej: 5" />
              </div>
            </SectionCard>

            <SectionCard title="Contacto" icon="contact_phone">
              <div className="fm-grid fm-grid-4">
                <Campo label="Correo electrónico" name="correo" type="email" value={cont.correo} onChange={bind(setCont)} placeholder="correo@ejemplo.com" span={2} />
                <Campo label="Celular" name="celular" value={cont.celular} onChange={bind(setCont)} placeholder="+57 300 000 0000" />
                <Campo label="Teléfono" name="telefono" value={cont.telefono} onChange={bind(setCont)} />
                <Campo label="Dirección correspondencia" name="direccion_correspondencia" value={cont.direccion_correspondencia} onChange={bind(setCont)} span={2} />
                <Campo label="Dirección consultorio" name="direccion_consultorio" value={cont.direccion_consultorio} onChange={bind(setCont)} span={2} />
              </div>
            </SectionCard>

            <SectionCard title="Idiomas y habilidades" icon="translate">
              <div className="fm-grid fm-grid-4">
                <CampoSelect label="Lengua de señas" name="maneja_lengua_senas" value={cont.maneja_lengua_senas?'SI':'NO'} onChange={e=>setCont(p=>({...p,maneja_lengua_senas:e.target.value==='SI'}))} options={[{value:'SI',label:'Sí'},{value:'NO',label:'No'}]} />
                <CampoSelect label="Inglés" name="idioma_ingles"    value={cont.idioma_ingles}    onChange={bind(setCont)} options={OPT_SNA} />
                <CampoSelect label="Francés" name="idioma_frances"  value={cont.idioma_frances}   onChange={bind(setCont)} options={OPT_SNA} />
                <CampoSelect label="Alemán" name="idioma_aleman"    value={cont.idioma_aleman}    onChange={bind(setCont)} options={OPT_SNA} />
                <CampoSelect label="Portugués" name="idioma_portugues" value={cont.idioma_portugues} onChange={bind(setCont)} options={OPT_SNA} />
                <CampoSelect label="Italiano" name="idioma_italiano" value={cont.idioma_italiano} onChange={bind(setCont)} options={OPT_SNA} />
                <Campo label="Otro idioma" name="idioma_otro" value={cont.idioma_otro} onChange={bind(setCont)} placeholder="Especificar…" />
              </div>
            </SectionCard>
          </>
        )}

        {/* ══ TAB 1: Contratación y Accesos ══════════════════ */}
        {tab===1 && (
          <>
            <SectionCard title="Vinculación contractual" icon="handshake">
              <div className="fm-grid fm-grid-4">
                <CampoSelect label="Tipo vinculación" name="tipo_vinculacion" value={vin.tipo_vinculacion} onChange={bind(setVin)} options={OPT_VIN} />
                <CampoSelect label="Estado contrato"  name="estado_contrato"  value={vin.estado_contrato}  onChange={bind(setVin)} options={OPT_EST} />
                <CampoSelect label="Modalidad honorarios" name="modalidad_honorarios" value={vin.modalidad_honorarios} onChange={bind(setVin)} options={[{value:'Fijo',label:'Fijo'},{value:'Variable',label:'Variable'},{value:'Mixto',label:'Mixto'}]} />
                <Campo label="Tiempo laborado" name="tiempo_laborado" value={vin.tiempo_laborado} onChange={bind(setVin)} placeholder="Ej: 2 años" />
              </div>
            </SectionCard>

            <SectionCard title="Inducciones" icon="school">
              <div className="fm-grid fm-grid-4">
                <CampoSelect label="Inducción médica FSFB"  name="induccion_medica_fsfb"  value={acc.induccion_medica_fsfb}  onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="Inducción médica CHSM"  name="induccion_medica_chsm"  value={acc.induccion_medica_chsm}  onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="Inducción general CHSM" name="induccion_general_chsm" value={acc.induccion_general_chsm} onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="Inducción HIS-ISIS"     name="induccion_his_isis"     value={acc.induccion_his_isis}     onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="Perfil de cargo"        name="perfil_cargo"           value={acc.perfil_cargo}           onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="Entrenamiento"          name="entrenamiento"          value={acc.entrenamiento}          onChange={bind(setAcc)} options={OPT_SNA} />
              </div>
            </SectionCard>

            <SectionCard title="Acreditaciones y accesos" icon="verified_user">
              <div className="fm-grid fm-grid-4">
                <CampoSelect label="Estado código"   name="estado_codigo"  value={acc.estado_codigo}  onChange={bind(setAcc)} options={OPT_EST} />
                <Campo       label="Código SMM"      name="codigo_smm"     value={acc.codigo_smm}     onChange={bind(setAcc)} placeholder="Código asignado" />
                <CampoSelect label="Estado carnet"   name="estado_carnet"  value={acc.estado_carnet}  onChange={bind(setAcc)} options={OPT_EST} />
                <Campo       label="Tarjeta acceso"  name="tarjeta_acceso" value={acc.tarjeta_acceso} onChange={bind(setAcc)} />
                <CampoSelect label="Estado bata"     name="estado_bata"    value={acc.estado_bata}    onChange={bind(setAcc)} options={OPT_EST} />
                <CampoSelect label="Almera"          name="entrega_almera" value={acc.entrega_almera} onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="RUAF"            name="entrega_ruaf"   value={acc.entrega_ruaf}   onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="MIPRES"          name="mipres"         value={acc.mipres}         onChange={bind(setAcc)} options={OPT_SNA} />
                <Campo       label="Correo corp."    name="correo_corporativo" type="email" value={acc.correo_corporativo} onChange={bind(setAcc)} placeholder="correo@serena.com.co" span={2} />
                <CampoSelect label="Radio expuesto"  name="radio_expuesto" value={acc.radio_expuesto} onChange={bind(setAcc)} options={OPT_SNA} />
                <CampoSelect label="Carta de turnos" name="carta_turnos"   value={acc.carta_turnos}   onChange={bind(setAcc)} options={OPT_SNA} />
              </div>
            </SectionCard>

            <SectionCard title="Pólizas" icon="policy">
              <div className="fm-grid fm-grid-4">
                <CampoSelect label="Póliza resp. civil"     name="poliza_resp_civil"      value={acc.poliza_resp_civil}      onChange={bind(setAcc)} options={OPT_EST} />
                <Campo       label="Vencimiento póliza"     name="fecha_venc_poliza" type="date" value={acc.fecha_venc_poliza} onChange={bind(setAcc)} />
                <CampoSelect label="Póliza complicaciones"  name="poliza_complicaciones"  value={acc.poliza_complicaciones}  onChange={bind(setAcc)} options={OPT_EST} />
              </div>
            </SectionCard>
          </>
        )}

        {/* ══ TAB 2: Normatividad ══════════════════════════════ */}
        {tab===2 && (
          <SectionCard title="Cursos normativos y vencimientos" icon="workspace_premium">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'0.75rem' }}>
              {CURSOS.map(c => {
                const est = norm[c.estado];
                const ec  = ESTADO_COLOR[est];
                return (
                  <div key={c.fecha} style={{ background:'#f8f9fb', borderRadius:10, border:'1px solid rgba(197,198,210,0.35)', padding:'0.875rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:'0.6875rem', fontWeight:700, color:'#0A2540', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                        {c.label}
                      </span>
                      {ec && (
                        <span style={{ fontSize:'0.625rem', fontWeight:700, padding:'2px 7px', borderRadius:9999, background:ec.bg, color:ec.color }}>
                          {est}
                        </span>
                      )}
                    </div>
                    <div className="form-group fm-field" style={{ marginBottom:0 }}>
                      <label className="form-label" style={{ fontSize:'0.6875rem' }}>Vencimiento</label>
                      <input name={c.fecha} type="date" className="form-input fm-input"
                        value={norm[c.fecha]??''} onChange={bind(setNorm)}
                        style={{ fontSize:'0.8125rem', padding:'5px 8px', height:34 }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ background:'#f8f9fb', borderRadius:10, border:'1px solid rgba(197,198,210,0.35)', padding:'0.875rem' }}>
                <span style={{ fontSize:'0.6875rem', fontWeight:700, color:'#0A2540', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>
                  Cursos 3 años
                </span>
                <CampoSelect label="Estado" name="cursos_3_anios" value={norm.cursos_3_anios} onChange={bind(setNorm)} options={OPT_SNA} />
              </div>
            </div>
          </SectionCard>
        )}

      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={()=>navigate('/medicos-fsfb')} disabled={saving}>
          <span className="material-symbols-outlined sm">arrow_back</span>Cancelar
        </button>
        <div style={{ display:'flex', gap:8 }}>
          {tab > 0 && (
            <button className="btn btn-tonal" onClick={()=>setTab(t=>t-1)} disabled={saving}>
              <span className="material-symbols-outlined sm">chevron_left</span>Anterior
            </button>
          )}
          {tab < 2 ? (
            <button className="btn btn-tonal" onClick={()=>setTab(t=>t+1)} disabled={saving}>
              Siguiente<span className="material-symbols-outlined sm">chevron_right</span>
            </button>
          ) : (
            <button className="btn btn-signature" onClick={handleSave} disabled={saving}>
              {saving
                ? <><span className="material-symbols-outlined sm" style={{animation:'spin 1s linear infinite'}}>progress_activity</span>Guardando…</>
                : <><span className="material-symbols-outlined sm">save</span>Guardar</>
              }
            </button>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
