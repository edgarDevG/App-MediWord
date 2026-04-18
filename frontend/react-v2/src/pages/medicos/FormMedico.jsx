/* ══════════════════════════════════════════════════════════════
   FormMedico.jsx v9 — MediWork HSM
   FIXES v9 (sobre v8):
   - Fix 1: useState(false) en loadingData — era useState(isEdit) → loading infinito
   - Fix 2: useEffect maestras con try/finally — garantiza liberación aunque falle endpoint
   - Fix 3: setTab1 lee estado_civil desde cont (contacto), no med
   - Fix 4: medicoPayload limpio — sin condicion_laboral/estado_civil, activo → estado string
   - Fix 5: contactoPayload incluye estado_civil
══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Tab2Habilitacion   from './Tab2Habilitacion';
import Tab3Especialidades from './Tab3Especialidades';
import Tab4Institucional  from './Tab4institucional';
import Tab5Revision       from './Tab5revision';
import './FormMedico.css';

const STEPS = [
  { id: 1, label: 'Datos del Médico',          icon: 'person'         },
  { id: 2, label: 'HV y Prerrogativas',        icon: 'folder_open'    },
  { id: 3, label: 'Académica y Habilitación',  icon: 'school'         },
  { id: 4, label: 'Contratación y Normativos', icon: 'local_hospital' },
  { id: 5, label: 'Revisión y Confirmar',      icon: 'task_alt'       },
];

const API = {
  medico:   (doc) => `/medicos/${doc}`,
  medicos:  ()    => `/medicos/`,
  hv:       (doc) => `/medicos/${doc}/documentos-hv/`,
  contacto: (doc) => `/medicos/${doc}/contacto/`,
  diplomas: (doc) => `/medicos/${doc}/diplomas-verificaciones/`,
};

const INIT_TAB1 = {
  tipo_documento: '', documento_identidad: '', lugar_expedicion: '',
  primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
  fecha_nacimiento: '', lugar_nacimiento: '', genero: '', estado_civil: '',
  correo_electronico: '', celular: '', telefono: '', direccion_residencia: '',
  categoria: '', condicion_laboral: '', fecha_ingreso: '', activo: true,
  dept_coordinacion_id: '', dept_direccion_medica_id: '', seccion_id: '', especialidad: '',
  contacto_emergencia: '', parentesco: '', tel_emergencia: '', correo_alterno: '',
};

const REQUIRED = ['tipo_documento', 'documento_identidad', 'primer_nombre', 'primer_apellido'];

function validateTab1(d) {
  const e = {};
  REQUIRED.forEach(f => { if (!d[f] || !String(d[f]).trim()) e[f] = 'Campo requerido'; });
  if (d.correo_electronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo_electronico))
    e.correo_electronico = 'Correo no válido';
  if (d.celular && !/^\d{7,15}$/.test(d.celular.replace(/\s/g, '')))
    e.celular = 'Número no válido (7-15 dígitos)';
  return e;
}

const toDateStr = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date)     return v.toISOString().slice(0, 10);
  if (v?.isoformat)          return String(v);
  return String(v).slice(0, 10);
};

const mappers = {
  lugaresExpedicion: (row) => ({ value: row.nombre, label: row.nombre }),
  lugaresNacimiento: (row) => ({ value: row.nombre, label: row.nombre }),
  categorias: (row) => ({
    value: row.code,
    label: `${row.code} – ${row.nombre}`,
  }),
  condicionesLab:   (row) => ({ value: row.condicion, label: row.condicion }),
  departamentos:    (row) => ({ value: row.id,        label: row.nombre }),
  secciones:        (row) => ({ value: row.id,        label: row.nombre }),
  especialidades:   (row) => ({ value: row.nombre,    label: row.nombre }),
};

function applyMapper(data, mapFn, fallback = []) {
  if (!Array.isArray(data) || data.length === 0) return fallback;
  return data.map(mapFn);
}

/* ── Campo texto ── */
function Campo({ label, name, type = 'text', value, onChange, error,
  required, disabled, placeholder, autoComplete, hint }) {
  return (
    <div className="form-group fm-field">
      <label className={`form-label${required ? ' required' : ''}`} htmlFor={name}>
        {label}
      </label>
      <input
        id={name} name={name} type={type}
        className={`form-input fm-input${error ? ' error' : ''}`}
        value={value ?? ''} onChange={onChange}
        disabled={disabled} placeholder={placeholder ?? ''}
        autoComplete={autoComplete}
        aria-required={required} aria-invalid={!!error}
        aria-describedby={error ? `${name}-err` : hint ? `${name}-hint` : undefined}
      />
      {hint && !error && (
        <span id={`${name}-hint`} className="fm-hint">
          <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>info</span>
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-err`} className="form-error-msg fm-error" role="alert">
          <span className="material-symbols-outlined sm">error</span>{error}
        </span>
      )}
    </div>
  );
}

/* ── CampoSelect ── */
function CampoSelect({ label, name, value, onChange, error, required,
  disabled, options = [], placeholder = 'Seleccionar...' }) {
  return (
    <div className="form-group fm-field">
      <label className={`form-label${required ? ' required' : ''}`} htmlFor={name}>
        {label}
      </label>
      <div className="fm-select-wrap">
        <select
          id={name} name={name}
          className={`form-select fm-select${error ? ' error' : ''}`}
          value={value ?? ''} onChange={onChange}
          disabled={disabled}
          aria-required={required} aria-invalid={!!error}
          aria-describedby={error ? `${name}-err` : undefined}
        >
          <option value="">{disabled ? 'Cargando…' : placeholder}</option>
          {options.map(opt => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {String(opt.label)}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined fm-select-arrow">expand_more</span>
      </div>
      {error && (
        <span id={`${name}-err`} className="form-error-msg fm-error" role="alert">
          <span className="material-symbols-outlined sm">error</span>{error}
        </span>
      )}
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({ title, icon, children }) {
  return (
    <div className="fm-section-card">
      <div className="fm-section-header">
        <span className="material-symbols-outlined fm-section-icon">{icon}</span>
        <span className="fm-section-title">{title}</span>
        <div className="fm-section-line" />
      </div>
      <div className="fm-section-body">
        {children}
      </div>
    </div>
  );
}

/* ── Stepper ── */
function StepperBar({ currentStep, completedSteps, onStepClick }) {
  const pct = Math.round((completedSteps.length / STEPS.length) * 100);
  return (
    <div className="stepper-bar fm-stepper">
      <div className="stepper-steps">
        {STEPS.map((step, idx) => {
          const isDone   = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;
          const canClick = isDone || completedSteps.includes(step.id - 1) || step.id === 1;
          return (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'center',
              flex: idx < STEPS.length - 1 ? 1 : 'none',
            }}>
              <div
                className={`step-item fm-step-item${isActive ? ' fm-step-active' : ''}${isDone ? ' fm-step-done' : ''}`}
                onClick={() => canClick && onStepClick(step.id)}
                style={{ cursor: canClick ? 'pointer' : 'default' }}
                title={canClick ? `Ir a: ${step.label}` : step.label}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={`step-circle fm-step-circle ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                  {isActive && <div className="fm-pulse-ring" />}
                  {isDone
                    ? <span className="material-symbols-outlined sm filled">check</span>
                    : isActive
                    ? <span className="material-symbols-outlined sm">{step.icon}</span>
                    : <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{step.id}</span>
                  }
                </div>
                <span className={`step-label${isActive ? ' active' : ''}`}>{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`step-connector fm-connector${isDone ? ' done' : ''}`}
                  style={{ marginBottom: 20 }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="stepper-progress fm-progress-wrap">
        <div className="progress-bar fm-progress-bar">
          <div className="progress-fill fm-progress-fill" style={{ width: `${pct}%` }}>
            <div className="fm-progress-shimmer" />
          </div>
        </div>
        <div className="progress-meta">
          <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>{pct}%</span>
          <span style={{ color: '#94a3b8' }}>completado</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════ */
export default function FormMedico() {
  const navigate      = useNavigate();
  const { documento } = useParams();
  const isEdit        = Boolean(documento);

  const [currentStep,    setCurrentStep]    = useState(1);
  const [completedSteps, setCompletedSteps] = useState(isEdit ? [1, 2, 3, 4] : []);
  const [medicoDoc,   setMedicoDoc]   = useState(isEdit ? documento : null);
  const [tab1,        setTab1]        = useState(INIT_TAB1);
  const [tab1Dirty,   setTab1Dirty]   = useState(false);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  // FIX 1: era useState(isEdit) → causaba loadingData=true desde el inicio
  const [loadingData, setLoadingData] = useState(false);

  const [rawExpedicion,   setRawExpedicion]   = useState([]);
  const [rawNacimiento,   setRawNacimiento]   = useState([]);
  const [rawCategorias,   setRawCategorias]   = useState([]);
  const [rawCondiciones,  setRawCondiciones]  = useState([]);
  const [rawDeptCoord,    setRawDeptCoord]    = useState([]);
  const [rawDeptDM,       setRawDeptDM]       = useState([]);
  const [rawSecciones,    setRawSecciones]    = useState([]);
  const [rawEspecialidades, setRawEspecialidades] = useState([]);
  const [loadingMaestras, setLoadingMaestras] = useState(true);
  const [maestrasListas,  setMaestrasListas]  = useState(false);

  const optExpedicion  = useMemo(() => applyMapper(rawExpedicion,  mappers.lugaresExpedicion), [rawExpedicion]);
  const optNacimiento  = useMemo(() => applyMapper(rawNacimiento,  mappers.lugaresNacimiento), [rawNacimiento]);
  const optCategorias  = useMemo(() => applyMapper(rawCategorias,  mappers.categorias, [
    { value: 'A',  label: 'A – Especialista'          },
    { value: 'AE', label: 'AE – Especialista Externo' },
    { value: 'AP', label: 'AP – Adicional Planta'     },
    { value: 'C',  label: 'C – Contratista'           },
  ]), [rawCategorias]);
  const optCondiciones    = useMemo(() => applyMapper(rawCondiciones,    mappers.condicionesLab),  [rawCondiciones]);
  const optDeptCoord      = useMemo(() => applyMapper(rawDeptCoord,      mappers.departamentos),   [rawDeptCoord]);
  const optDeptDM         = useMemo(() => applyMapper(rawDeptDM,         mappers.departamentos),   [rawDeptDM]);
  const optSecciones      = useMemo(() => applyMapper(rawSecciones,      mappers.secciones),       [rawSecciones]);
  const optEspecialidades = useMemo(() => applyMapper(rawEspecialidades, mappers.especialidades),  [rawEspecialidades]);

  const markCompleted = (n) =>
    setCompletedSteps(prev => [...new Set([...prev, n])]);

  const goStep = (n) => {
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nombreMostrar = [
    tab1.primer_nombre, tab1.segundo_nombre,
    tab1.primer_apellido, tab1.segundo_apellido,
  ].filter(Boolean).join(' ');

  // FIX 2: try/finally garantiza que loadingMaestras y maestrasListas
  // siempre se resuelven aunque falle algún endpoint de maestras
  useEffect(() => {
    const load = async () => {
      setLoadingMaestras(true);
      try {
        const [rExp, rNac, rCat, rCond, rDCoord, rDDM, rSec, rEsp] = await Promise.allSettled([
          axiosInstance.get('/maestras/ciudades',                          { skipToast: true }),
          axiosInstance.get('/maestras/ciudades',                          { skipToast: true }),
          axiosInstance.get('/maestras/categorias-metricas',               { skipToast: true }),
          axiosInstance.get('/maestras/condiciones-laborales',             { skipToast: true }),
          axiosInstance.get('/maestras/departamentos/?tipo=coordinacion',  { skipToast: true }),
          axiosInstance.get('/maestras/departamentos/?tipo=dm',            { skipToast: true }),
          axiosInstance.get('/maestras/secciones/',                        { skipToast: true }),
          axiosInstance.get('/maestras/especialidades/',                   { skipToast: true }),
        ]);
        if (rExp.status    === 'fulfilled') setRawExpedicion(rExp.value.data       ?? []);
        if (rNac.status    === 'fulfilled') setRawNacimiento(rNac.value.data       ?? []);
        if (rCat.status    === 'fulfilled') setRawCategorias(rCat.value.data       ?? []);
        if (rCond.status   === 'fulfilled') setRawCondiciones(rCond.value.data     ?? []);
        if (rDCoord.status === 'fulfilled') setRawDeptCoord(rDCoord.value.data     ?? []);
        if (rDDM.status    === 'fulfilled') setRawDeptDM(rDDM.value.data           ?? []);
        if (rSec.status    === 'fulfilled') setRawSecciones(rSec.value.data        ?? []);
        if (rEsp.status    === 'fulfilled') setRawEspecialidades(rEsp.value.data   ?? []);
      } catch (e) {
        console.error('[FormMedico v9] maestras error inesperado:', e);
      } finally {
        setLoadingMaestras(false); // SIEMPRE libera los selects
        setMaestrasListas(true);   // SIEMPRE activa la carga del médico
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isEdit || !maestrasListas) return;
    const loadMedico = async () => {
      setLoadingData(true);
      try {
        const [rMed, rHV, rContacto] = await Promise.allSettled([
          axiosInstance.get(API.medico(documento),  { skipToast: true }),
          axiosInstance.get(API.hv(documento),       { skipToast: true }),
          axiosInstance.get(API.contacto(documento), { skipToast: true }),
        ]);
        const med  = rMed.status      === 'fulfilled' ? (rMed.value.data      ?? {}) : {};
        const hv   = rHV.status       === 'fulfilled' ? (rHV.value.data       ?? {}) : {};
        const cont = rContacto.status === 'fulfilled' ? (rContacto.value.data ?? {}) : {};

        let primerNombre    = med.primer_nombre    ?? '';
        let segundoNombre   = med.segundo_nombre   ?? '';
        let primerApellido  = med.primer_apellido  ?? '';
        let segundoApellido = med.segundo_apellido ?? '';

        if (!primerNombre && med.nombre_medico) {
          const p = med.nombre_medico.trim().split(/\s+/);
          primerNombre = p[0] ?? '';
          if      (p.length >= 4) { segundoNombre = p[1]; primerApellido = p[2]; segundoApellido = p[3]; }
          else if (p.length === 3) { primerApellido = p[1]; segundoApellido = p[2]; }
          else if (p.length === 2) { primerApellido = p[1]; }
        }

        setTab1({
          documento_identidad: med.documento_identidad ?? documento,
          categoria:                med.categoria                ?? '',
          condicion_laboral:        '',
          fecha_ingreso:            toDateStr(med.fecha_ingreso),
          dept_coordinacion_id:     med.dept_coordinacion_id     ?? '',
          dept_direccion_medica_id: med.dept_direccion_medica_id ?? '',
          seccion_id:               med.seccion_id               ?? '',
          especialidad:             med.especialidad             ?? '',
          // FIX 3b: activo puede venir como campo estado='INACTIVO' en algunos backends
          activo:              med.estado === 'INACTIVO' ? false : (med.activo ?? true),
          // FIX 3c: estado_civil viene de contacto, no de medico
          estado_civil:        cont.estado_civil ?? '',
          primer_nombre:    primerNombre,
          segundo_nombre:   segundoNombre,
          primer_apellido:  primerApellido,
          segundo_apellido: segundoApellido,
          tipo_documento:   hv.tipo_documento   ?? hv.tipodocumento   ?? '',
          lugar_expedicion: hv.lugar_expedicion ?? hv.lugarexpedicion ?? '',
          fecha_nacimiento: toDateStr(hv.fecha_nacimiento ?? hv.fechanacimiento),
          lugar_nacimiento: hv.lugar_nacimiento ?? hv.lugarnacimiento ?? '',
          genero:           hv.sexo             ?? hv.genero          ?? '',
          correo_electronico:   cont.correo                    ?? cont.correo_electronico           ?? '',
          celular:              cont.celular                   ?? '',
          telefono:             cont.telefono                  ?? '',
          direccion_residencia: cont.direccion_correspondencia ?? cont.direccioncorrespondencia      ?? '',
          contacto_emergencia:  cont.contacto_emergencia       ?? '',
          parentesco:           cont.parentesco                ?? '',
          tel_emergencia:       cont.tel_emergencia            ?? '',
          correo_alterno:       cont.correo_alterno            ?? '',
        });
        setMedicoDoc(med.documento_identidad ?? documento);
        markCompleted(1);
      } catch (e) {
        console.error('[FormMedico v9] Error cargando médico:', e);
      } finally {
        setLoadingData(false);
      }
    };
    loadMedico();
  }, [isEdit, maestrasListas, documento]); // eslint-disable-line

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTab1(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setTab1Dirty(true);
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const upsert = async (putUrl, postUrl, payload, docId) => {
    try {
      await axiosInstance.put(putUrl, payload);
    } catch (err) {
      if (err.response?.status === 404) {
        await axiosInstance.post(postUrl, { ...payload, documento_identidad: docId });
      } else { throw err; }
    }
  };

  const handleNextTab1 = async () => {
    const errs = validateTab1(tab1);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.getElementById(Object.keys(errs)[0])
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (isEdit && !tab1Dirty) { markCompleted(1); goStep(2); return; }

    setSaving(true); setSaveError(null);
    try {
      const docId = medicoDoc ?? tab1.documento_identidad;
      const nombreCompleto = [tab1.primer_nombre, tab1.segundo_nombre,
        tab1.primer_apellido, tab1.segundo_apellido].filter(Boolean).join(' ').trim();

      // FIX 4: medicoPayload solo contiene campos de la tabla medicos
      // condicion_laboral y estado_civil NO van aquí
      const medicoPayload = {
        primer_nombre:            tab1.primer_nombre,
        segundo_nombre:           tab1.segundo_nombre           || null,
        primer_apellido:          tab1.primer_apellido,
        segundo_apellido:         tab1.segundo_apellido         || null,
        categoria:                tab1.categoria                || null,
        fecha_ingreso:            tab1.fecha_ingreso            || null,
        estado:                   tab1.activo ? 'ACTIVO' : 'INACTIVO',
        dept_coordinacion_id:     tab1.dept_coordinacion_id     || null,
        dept_direccion_medica_id: tab1.dept_direccion_medica_id || null,
        seccion_id:               tab1.seccion_id               || null,
        especialidad:             tab1.especialidad             || null,
      };

      if (isEdit || medicoDoc) {
        await axiosInstance.put(API.medico(docId), medicoPayload);
      } else {
        const res = await axiosInstance.post(API.medicos(), {
          ...medicoPayload, documento_identidad: tab1.documento_identidad,
        });
        setMedicoDoc(res.data?.documento_identidad ?? tab1.documento_identidad);
      }

      const savedDoc = medicoDoc ?? tab1.documento_identidad;
      const hvPayload = {
        tipo_documento:   tab1.tipo_documento   || null,
        lugar_expedicion: tab1.lugar_expedicion || null,
        fecha_nacimiento: tab1.fecha_nacimiento || null,
        lugar_nacimiento: tab1.lugar_nacimiento || null,
        sexo:             tab1.genero           || null,
      };
      try { await upsert(API.hv(savedDoc), API.hv(savedDoc), hvPayload, savedDoc); }
      catch (hvErr) { console.warn('[FormMedico v9] documentos_hv:', hvErr); }

      // FIX 5: contactoPayload incluye estado_civil (tabla contacto sí lo tiene)
      const contactoPayload = {
        correo:                    tab1.correo_electronico  || null,
        celular:                   tab1.celular             || null,
        telefono:                  tab1.telefono            || null,
        direccion_correspondencia: tab1.direccion_residencia || null,
        estado_civil:              tab1.estado_civil        || null,
        contacto_emergencia:       tab1.contacto_emergencia || null,
        parentesco:                tab1.parentesco          || null,
        tel_emergencia:            tab1.tel_emergencia      || null,
        correo_alterno:            tab1.correo_alterno      || null,
      };
      try { await upsert(API.contacto(savedDoc), API.contacto(savedDoc), contactoPayload, savedDoc); }
      catch (contErr) { console.warn('[FormMedico v9] datos_contacto:', contErr); }

      setTab1Dirty(false); markCompleted(1); goStep(2);
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors = {}; const generalMsgs = [];
        detail.forEach(err => {
          const field = err.loc?.[err.loc.length - 1];
          const msg   = err.msg ?? 'Campo inválido';
          if (field && Object.prototype.hasOwnProperty.call(tab1, field)) fieldErrors[field] = msg;
          else generalMsgs.push(msg);
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          document.getElementById(Object.keys(fieldErrors)[0])
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (generalMsgs.length > 0) setSaveError(generalMsgs.join(' · '));
      } else {
        setSaveError(typeof detail === 'string' ? detail : 'Error al guardar. Intenta de nuevo.');
      }
    } finally { setSaving(false); }
  };

  const OPT_TIPO_DOC = [
    { value: 'CC',  label: 'Cédula de Ciudadanía'            },
    { value: 'CE',  label: 'Cédula de Extranjería'           },
    { value: 'PA',  label: 'Pasaporte'                       },
    { value: 'PEP', label: 'Permiso Especial de Permanencia' },
  ];
  const OPT_GENERO = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino'  },
    { value: 'O', label: 'Otro'      },
  ];
  const OPT_EST_CIVIL = [
    { value: 'S', label: 'Soltero/a'    },
    { value: 'C', label: 'Casado/a'     },
    { value: 'U', label: 'Unión libre'  },
    { value: 'D', label: 'Divorciado/a' },
    { value: 'V', label: 'Viudo/a'      },
  ];

  /* ══ RENDER ══ */
  return (
    <div className="fm-root">
      <StepperBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      {/* ── Step 1 ── */}
      {currentStep === 1 && (
        <div className="fm-content fm-animate-in">

          {/* ── Hero Header ── */}
          <div className="fm-hero-header">
            <div className="fm-hero-header-inner">
              <div className="fm-hero-title-row">
                <div className="fm-hero-icon-wrap">
                  <span className="material-symbols-outlined">
                    {isEdit ? 'manage_accounts' : 'person_add'}
                  </span>
                </div>
                <div>
                  <h2 className="fm-hero-title">
                    {isEdit ? 'Editar médico' : 'Nuevo médico'}
                    <span className="fm-hero-subtitle"> — Datos del Médico</span>
                  </h2>
                  <p className="fm-hero-desc">
                    Información personal e institucional básica del médico adscrito.
                  </p>
                </div>
              </div>

              {isEdit && nombreMostrar && (
                <div className="fm-doctor-chip">
                  <div className="fm-doctor-chip-avatar">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="fm-doctor-chip-info">
                    <span className="fm-doctor-chip-name">{nombreMostrar}</span>
                    <span className="fm-doctor-chip-doc">CC {documento}</span>
                  </div>
                  <div className={`fm-status-dot ${tab1.activo ? 'active' : 'inactive'}`} />
                </div>
              )}
            </div>
          </div>

          {/* Banner loading */}
          {loadingData && (
            <div className="fm-banner fm-banner-info">
              <div className="fm-banner-icon">
                <span className="material-symbols-outlined"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  progress_activity
                </span>
              </div>
              <div className="fm-banner-text">
                <strong>Cargando datos</strong>
                <span>Recuperando información del médico desde el servidor…</span>
              </div>
            </div>
          )}

          {/* Banner error */}
          {saveError && (
            <div role="alert" className="fm-banner fm-banner-error">
              <div className="fm-banner-icon">
                <span className="material-symbols-outlined">error</span>
              </div>
              <div className="fm-banner-text">
                <strong>Error al guardar</strong>
                <span>{saveError}</span>
              </div>
              <button className="fm-banner-close" onClick={() => setSaveError(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {/* ── Sección: Identificación ── */}
          <SectionCard title="Identificación" icon="badge">
            <div className="fm-grid fm-grid-3">
              <CampoSelect label="Tipo de documento" name="tipo_documento"
                value={tab1.tipo_documento} onChange={handleChange}
                options={OPT_TIPO_DOC} error={errors.tipo_documento} required />
              <Campo label="Número de documento" name="documento_identidad"
                value={tab1.documento_identidad} onChange={handleChange}
                error={errors.documento_identidad} required
                disabled={isEdit} placeholder="Ej: 1045234112"
                autoComplete="off"
                hint={!isEdit ? 'No podrá modificarse después de guardar' : undefined} />
              <CampoSelect label="Lugar de expedición" name="lugar_expedicion"
                value={tab1.lugar_expedicion} onChange={handleChange}
                options={optExpedicion} placeholder="Seleccionar ciudad…"
                disabled={loadingMaestras} />
            </div>
          </SectionCard>

          {/* ── Sección: Nombre completo ── */}
          <SectionCard title="Nombre completo" icon="person">
            <div className="fm-grid fm-grid-4">
              <Campo label="Primer nombre"    name="primer_nombre"
                value={tab1.primer_nombre}    onChange={handleChange}
                error={errors.primer_nombre}  required placeholder="Ej: Carlos" />
              <Campo label="Segundo nombre"   name="segundo_nombre"
                value={tab1.segundo_nombre}   onChange={handleChange}
                placeholder="Opcional" />
              <Campo label="Primer apellido"  name="primer_apellido"
                value={tab1.primer_apellido}  onChange={handleChange}
                error={errors.primer_apellido} required placeholder="Ej: Martínez" />
              <Campo label="Segundo apellido" name="segundo_apellido"
                value={tab1.segundo_apellido} onChange={handleChange}
                placeholder="Opcional" />
            </div>
          </SectionCard>

          {/* ── Sección: Datos personales ── */}
          <SectionCard title="Datos personales" icon="cake">
            <div className="fm-grid fm-grid-4">
              <Campo label="Fecha de nacimiento" name="fecha_nacimiento"
                type="date" value={tab1.fecha_nacimiento} onChange={handleChange} />
              <CampoSelect label="Lugar de nacimiento" name="lugar_nacimiento"
                value={tab1.lugar_nacimiento} onChange={handleChange}
                options={optNacimiento} placeholder="Seleccionar ciudad…"
                disabled={loadingMaestras} />
              <CampoSelect label="Género" name="genero"
                value={tab1.genero} onChange={handleChange} options={OPT_GENERO} />
              <CampoSelect label="Estado civil" name="estado_civil"
                value={tab1.estado_civil} onChange={handleChange} options={OPT_EST_CIVIL} />
            </div>
          </SectionCard>

          {/* ── Sección: Contacto ── */}
          <SectionCard title="Contacto" icon="contact_phone">
            <div className="fm-grid fm-grid-4">
              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Correo electrónico" name="correo_electronico" type="email"
                  value={tab1.correo_electronico} onChange={handleChange}
                  error={errors.correo_electronico}
                  placeholder="medico@serena.com.co" autoComplete="email" />
              </div>
              <Campo label="Celular" name="celular" type="tel"
                value={tab1.celular} onChange={handleChange}
                error={errors.celular} placeholder="Ej: 3001234567" />
              <Campo label="Teléfono fijo" name="telefono" type="tel"
                value={tab1.telefono} onChange={handleChange}
                placeholder="Ej: 6057654321" />
              <div style={{ gridColumn: 'span 4' }}>
                <Campo label="Dirección de residencia" name="direccion_residencia"
                  value={tab1.direccion_residencia} onChange={handleChange}
                  placeholder="Ej: Cra 12 # 34-56, Cartagena" />
              </div>
            </div>
          </SectionCard>

          {/* ── Sección: Vinculación institucional ── */}
          <SectionCard title="Vinculación institucional" icon="local_hospital">
            <div className="fm-grid fm-grid-4">
              <div>
                <CampoSelect label="Categoría" name="categoria"
                  value={tab1.categoria} onChange={handleChange}
                  options={optCategorias} error={errors.categoria} required
                  disabled={loadingMaestras} placeholder="Seleccionar categoría…" />
                {tab1.categoria && (
                  <span className="fm-cat-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>label</span>
                    Cat {tab1.categoria}
                  </span>
                )}
              </div>
              <CampoSelect label="Condición laboral" name="condicion_laboral"
                value={tab1.condicion_laboral} onChange={handleChange}
                options={optCondiciones} disabled={loadingMaestras}
                placeholder="Seleccionar condición…" />
              <Campo label="Fecha de ingreso" name="fecha_ingreso"
                type="date" value={tab1.fecha_ingreso} onChange={handleChange} />
              <CampoSelect label="Dpto. Coordinación" name="dept_coordinacion_id"
                value={tab1.dept_coordinacion_id} onChange={handleChange}
                options={optDeptCoord} disabled={loadingMaestras}
                placeholder="Seleccionar departamento…" />
              <CampoSelect label="Dpto. Dirección Médica" name="dept_direccion_medica_id"
                value={tab1.dept_direccion_medica_id} onChange={handleChange}
                options={optDeptDM} disabled={loadingMaestras}
                placeholder="Seleccionar departamento…" />
              <CampoSelect label="Sección" name="seccion_id"
                value={tab1.seccion_id} onChange={handleChange}
                options={optSecciones} disabled={loadingMaestras}
                placeholder="Seleccionar sección…" />
              <CampoSelect label="Especialidad métrica" name="especialidad"
                value={tab1.especialidad} onChange={handleChange}
                options={optEspecialidades} disabled={loadingMaestras}
                placeholder="Seleccionar especialidad…" />

              {/* Toggle activo */}
              <div className="form-group fm-field">
                <label className="form-label">Estado del médico</label>
                <button
                  type="button"
                  onClick={() => { setTab1(prev => ({ ...prev, activo: !prev.activo })); setTab1Dirty(true); }}
                  className={`fm-toggle-btn ${tab1.activo ? 'fm-toggle-active' : 'fm-toggle-inactive'}`}
                >
                  <div className="fm-toggle-track">
                    <div className="fm-toggle-thumb" />
                    <span className="fm-toggle-icon material-symbols-outlined">
                      {tab1.activo ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <span className="fm-toggle-label">
                    {tab1.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ── Sección: Contacto de emergencia ── */}
          <SectionCard title="Contacto de emergencia" icon="emergency">
            <div className="fm-grid fm-grid-4">
              <Campo label="Nombre contacto emergencia" name="contacto_emergencia"
                value={tab1.contacto_emergencia} onChange={handleChange}
                placeholder="Nombre completo" />
              <Campo label="Parentesco" name="parentesco"
                value={tab1.parentesco} onChange={handleChange}
                placeholder="Ej: Cónyuge" />
              <Campo label="Teléfono emergencia" name="tel_emergencia"
                value={tab1.tel_emergencia} onChange={handleChange}
                placeholder="Ej: 3001234567" />
              <Campo label="Correo alterno" name="correo_alterno" type="email"
                value={tab1.correo_alterno} onChange={handleChange}
                placeholder="correo@ejemplo.com" />
            </div>
          </SectionCard>

        </div>
      )}

      {/* ── Steps 2-5 ── */}
      {currentStep === 2 && (
        <Tab2Habilitacion medicoDoc={medicoDoc ?? documento}
          onNext={() => { markCompleted(2); goStep(3); }}
          onPrev={() => goStep(1)} markCompleted={markCompleted} />
      )}
      {currentStep === 3 && (
        <Tab3Especialidades medicoDoc={medicoDoc ?? documento}
          onNext={() => { markCompleted(3); goStep(4); }}
          onPrev={() => goStep(2)} markCompleted={markCompleted} />
      )}
      {currentStep === 4 && (
        <Tab4Institucional medicoDoc={medicoDoc ?? documento}
          onNext={() => { markCompleted(4); goStep(5); }}
          onPrev={() => goStep(3)} markCompleted={markCompleted} />
      )}
      {currentStep === 5 && (
        <Tab5Revision medicoDoc={medicoDoc ?? documento}
          tab1Data={tab1} onPrev={() => goStep(4)}
          completedSteps={completedSteps} markCompleted={markCompleted} />
      )}

      {/* ── Footer sticky ── */}
      {currentStep === 1 && (
        <div className="form-footer">
          <button className="btn btn-tonal" onClick={() => navigate('/medicos')} disabled={saving}>
            <span className="material-symbols-outlined sm">arrow_back</span>
            Cancelar
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:13, minHeight:'inherit', minWidth: 'fit-content', maxWidth: '100%' }}>
            {saving && (
              <span style={{ fontSize: '0.9rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined sm" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                Guardando…
              </span>
            )}
            <button className="btn btn-signature" onClick={handleNextTab1} disabled={saving || loadingMaestras || loadingData}>
              {isEdit ? (tab1Dirty ? 'Actualizar y continuar' : 'Continuar') : 'Guardar y continuar'}
              <span className="material-symbols-outlined sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* ── Root layout ── */
        .fm-root {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 64px);
          margin: -2rem;
          background: var(--color-background, #f8f9fb);
        }

        /* ── Animate in ── */
        @keyframes fm-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fm-animate-in {
          animation: fm-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Content area ── */
        .fm-content {
          flex: 1;
          padding: 3rem 2rem calc(var(--mw-footer-h) + 2rem) !important;
        }

        /* ── Hero Header ── */
        .fm-hero-header {
          background: linear-gradient(135deg,
            rgba(0,16,62,0.04) 0%,
            rgba(26,78,215,0.06) 50%,
            rgba(0,16,62,0.02) 100%);
          border: 1px solid rgba(26,78,215,0.12);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 0.25rem;
          position: relative;
          overflow: hidden;
        }
        .fm-hero-header::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 100%;
          background: linear-gradient(180deg, var(--color-primary, #00103e), var(--color-secondary, #1a4ed7));
          border-radius: 4px 0 0 4px;
        }
        .fm-hero-header-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .fm-hero-title-row {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }
        .fm-hero-icon-wrap {
          width: 44px; height: 44px;
          background: var(--color-primary, #00103e);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,16,62,0.3);
        }
        .fm-hero-icon-wrap .material-symbols-outlined {
          color: white; font-size: 1.375rem;
        }
        .fm-hero-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary, #00103e);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .fm-hero-subtitle {
          font-weight: 400;
          color: var(--color-on-surface-variant, #444650);
        }
        .fm-hero-desc {
          font-size: 0.8125rem;
          color: var(--color-on-surface-variant, #444650);
          margin-top: 4px;
        }

        /* Doctor chip */
        .fm-doctor-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 8px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(26,78,215,0.18);
          border-radius: 50px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(26,78,215,0.1);
          flex-shrink: 0;
        }
        .fm-doctor-chip-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--color-primary, #00103e), var(--color-secondary, #1a4ed7));
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .fm-doctor-chip-avatar .material-symbols-outlined {
          color: white; font-size: 1.1rem;
        }
        .fm-doctor-chip-info { display: flex; flex-direction: column; gap: 1px; }
        .fm-doctor-chip-name {
          font-size: 0.8125rem; font-weight: 700;
          color: var(--color-primary, #00103e);
        }
        .fm-doctor-chip-doc {
          font-size: 0.6875rem;
          color: #64748b;
        }
        .fm-status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          box-shadow: 0 0 0 2px white;
        }
        .fm-status-dot.active { background: #16a34a; box-shadow: 0 0 0 2px white, 0 0 6px rgba(22,163,74,0.5); }
        .fm-status-dot.inactive { background: #94a3b8; }

        /* ── Banners ── */
        .fm-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid;
          animation: fm-fade-in 0.25s ease both;
        }
        .fm-banner-info {
          background: rgba(26,78,215,0.05);
          border-color: rgba(26,78,215,0.18);
        }
        .fm-banner-error {
          background: rgba(186,26,26,0.06);
          border-color: rgba(186,26,26,0.2);
        }
        .fm-banner-icon {
          width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .fm-banner-info .fm-banner-icon {
          background: rgba(26,78,215,0.1);
          color: var(--color-secondary, #1a4ed7);
        }
        .fm-banner-error .fm-banner-icon {
          background: rgba(186,26,26,0.1);
          color: var(--color-error, #ba1a1a);
        }
        .fm-banner-text {
          flex: 1;
          display: flex; flex-direction: column; gap: 2px;
        }
        .fm-banner-text strong {
          font-size: 0.875rem; font-weight: 700;
          color: var(--color-on-surface, #191c1e);
        }
        .fm-banner-text span { font-size: 0.8125rem; color: #64748b; }
        .fm-banner-error .fm-banner-text strong { color: var(--color-error, #ba1a1a); }
        .fm-banner-close {
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px;
          display: flex; align-items: center;
          border-radius: 6px;
          transition: color 150ms, background 150ms;
        }
        .fm-banner-close:hover { color: var(--color-error, #ba1a1a); background: rgba(186,26,26,0.08); }

        /* ── Section Cards ── */
        .fm-section-card {
          background: var(--color-surface-container-lowest, #ffffff);
          border: 1px solid rgba(197,198,210,0.35);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(25,28,30,0.05);
          transition: box-shadow 250ms;
        }
        .fm-section-card:hover {
          box-shadow: 0 2px 12px rgba(25,28,30,0.08);
        }
        .fm-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(90deg,
            rgba(0,16,62,0.03) 0%,
            rgba(26,78,215,0.025) 100%);
          border-bottom: 1px solid rgba(197,198,210,0.3);
        }
        .fm-section-icon {
          font-size: 1.1rem;
          color: var(--color-secondary, #1a4ed7);
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .fm-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-primary, #00103e);
        }
        .fm-section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(197,198,210,0.5) 0%, transparent 100%);
        }
        .fm-section-body {
          padding: 1.25rem 1.25rem;
        }

        /* ── Grids ── */
        .fm-grid {
          display: grid;
          gap: 1rem;
        }
        .fm-grid-3 { grid-template-columns: repeat(3, 1fr); }
        .fm-grid-4 { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 900px) {
          .fm-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .fm-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .fm-grid-4, .fm-grid-3 { grid-template-columns: 1fr; }
        }

        /* ── Inputs ── */
        .fm-field .form-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-on-surface-variant, #444650);
          letter-spacing: 0.01em;
          margin-bottom: 6px;
          display: block;
          transition: color 150ms;
        }
        .fm-field:focus-within .form-label {
          color: var(--color-secondary, #1a4ed7);
        }
        .fm-input, .fm-select {
          width: 100%;
          background: var(--color-background, #f8f9fb);
          border: 1.5px solid rgba(197,198,210,0.6);
          border-radius: 10px;
          padding: 0.5625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--color-on-surface, #191c1e);
          transition: border-color 180ms, box-shadow 180ms, background 180ms;
          outline: none;
        }
        .fm-input:hover, .fm-select:hover {
          border-color: rgba(26,78,215,0.35);
          background: #ffffff;
        }
        .fm-input:focus, .fm-select:focus {
          border-color: var(--color-secondary, #1a4ed7);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(26,78,215,0.12);
        }
        .fm-input.error, .fm-select.error {
          border-color: var(--color-error, #ba1a1a);
          background: rgba(186,26,26,0.03);
          box-shadow: 0 0 0 3px rgba(186,26,26,0.1);
        }
        .fm-input:disabled, .fm-select:disabled {
          background: rgba(197,198,210,0.15);
          color: #94a3b8;
          cursor: not-allowed;
          border-color: rgba(197,198,210,0.3);
        }
        input[type="date"].fm-input::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
        }
        .fm-select-wrap { position: relative; }
        .fm-select { appearance: none; padding-right: 2.5rem; cursor: pointer; }
        .fm-select-arrow {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8; font-size: 1.1rem;
          pointer-events: none;
          transition: color 180ms;
        }
        .fm-select-wrap:focus-within .fm-select-arrow {
          color: var(--color-secondary, #1a4ed7);
        }
        .fm-hint {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.7rem; color: #94a3b8; margin-top: 4px;
        }
        .fm-error {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.75rem;
          color: var(--color-error, #ba1a1a);
          margin-top: 5px;
          animation: fm-fade-in 0.2s ease both;
        }

        /* ── Category badge ── */
        .fm-cat-badge {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.7rem; font-weight: 700;
          background: rgba(26,78,215,0.1);
          color: var(--color-secondary, #1a4ed7);
          border: 1px solid rgba(26,78,215,0.2);
        }

        /* ── Toggle ── */
        .fm-toggle-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 0.5rem 1rem;
          width: 100%;
          border-radius: 10px;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
          position: relative;
          overflow: hidden;
        }
        .fm-toggle-active {
          background: rgba(6,95,70,0.08);
          border: 1.5px solid rgba(6,95,70,0.3);
        }
        .fm-toggle-inactive {
          background: var(--color-surface-container, #edeef0);
          border: 1.5px solid rgba(197,198,210,0.5);
        }
        .fm-toggle-active:hover { background: rgba(6,95,70,0.12); }
        .fm-toggle-inactive:hover { background: rgba(197,198,210,0.3); }
        .fm-toggle-track {
          width: 40px; height: 22px;
          border-radius: 11px;
          flex-shrink: 0;
          position: relative;
          transition: background 250ms;
          display: flex; align-items: center;
        }
        .fm-toggle-active .fm-toggle-track { background: #065f46; }
        .fm-toggle-inactive .fm-toggle-track { background: #cbd5e1; }
        .fm-toggle-thumb {
          position: absolute;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: left 220ms cubic-bezier(0.16,1,0.3,1);
        }
        .fm-toggle-active .fm-toggle-thumb  { left: 21px; }
        .fm-toggle-inactive .fm-toggle-thumb { left: 3px; }
        .fm-toggle-icon {
          position: absolute; right: 4px;
          font-size: 0.875rem; font-variation-settings: 'FILL' 1;
          transition: opacity 200ms;
        }
        .fm-toggle-active .fm-toggle-icon   { color: white; opacity: 0.9; }
        .fm-toggle-inactive .fm-toggle-icon { color: white; opacity: 0.6; }
        .fm-toggle-label {
          font-size: 0.875rem; font-weight: 600;
          transition: color 200ms;
        }
        .fm-toggle-active .fm-toggle-label  { color: #065f46; }
        .fm-toggle-inactive .fm-toggle-label { color: #64748b; }

        /* ── Stepper ── */
        .fm-stepper {
          background: var(--color-surface-container-lowest, #ffffff);
          border-bottom: 1px solid rgba(197,198,210,0.4);
          box-shadow: 0 1px 8px rgba(25,28,30,0.06);
        }
        .fm-step-circle { position: relative; }
        .fm-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid var(--color-secondary, #1a4ed7);
          opacity: 0;
          animation: fm-pulse 2s ease-in-out infinite;
        }
        @keyframes fm-pulse {
          0%   { transform: scale(0.85); opacity: 0.8; }
          70%  { transform: scale(1.3);  opacity: 0;   }
          100% { transform: scale(1.3);  opacity: 0;   }
        }
        .step-circle.done {
          background: var(--color-secondary, #1a4ed7) !important;
          box-shadow: 0 0 0 3px rgba(26,78,215,0.2);
        }
        .fm-connector {
          flex: 1;
          height: 2px;
          background: rgba(197,198,210,0.5);
          transition: background 400ms;
        }
        .fm-connector.done {
          background: linear-gradient(90deg, var(--color-secondary, #1a4ed7), rgba(26,78,215,0.4));
        }

        /* Progress bar */
        .fm-progress-bar {
          height: 6px !important;
          border-radius: 9999px;
          background: rgba(197,198,210,0.3);
          overflow: hidden;
        }
        .fm-progress-fill {
          height: 100%;
          background: linear-gradient(90deg,
            var(--color-primary, #00103e) 0%,
            var(--color-secondary, #1a4ed7) 100%);
          border-radius: 9999px;
          transition: width 500ms cubic-bezier(0.16,1,0.3,1);
          position: relative;
          overflow: hidden;
        }
        .fm-progress-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          animation: fm-shimmer 2s ease-in-out infinite;
          background-size: 200% 100%;
        }
        @keyframes fm-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200%  0; }
        }

        /* ── Footer sticky ── */
        .form-footer-sticky {
          position: sticky;
          bottom: 0;
          margin: 0 calc(-1 * var(--space-8)) calc(-1 * var(--space-8));
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          box-shadow: 0 -4px 12px oklch(0.25 0.04 220 / 0.06);
          z-index: 5;
        }
        .fm-footer-inner {
          max-width: 980px;
          margin: 0 auto;
          padding: var(--space-4) var(--space-8);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fm-footer-right {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .fm-saving-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--color-text-faint);
        }

        /* ── Button enhancements ── */
        .fm-btn-next {
          display: flex; align-items: center; gap: 6px;
          padding: 0.625rem 1.25rem;
          font-weight: 700; font-size: 0.875rem;
          border-radius: 10px;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 4px 12px rgba(0,16,62,0.2);
        }
        .fm-btn-next:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(0,16,62,0.3);
          transform: translateY(-1px);
        }
        .fm-btn-next:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0,16,62,0.15);
        }
        .fm-btn-next:disabled {
          opacity: 0.55; cursor: not-allowed;
        }
        .fm-btn-cancel {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.875rem; border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
