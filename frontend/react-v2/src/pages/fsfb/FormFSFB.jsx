/* ═══════════════════════════════════════════════════════════════
   FormFSFB.jsx v2 — Médico FSFB · MediWord HSM
   Endpoints: /medicos/ + /medicos/{doc}/accesos/ + /normativos/
   Estilo:    FormMedico.css (clases fm-*)
══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import '../medicos/FormMedico.css';

const OPT_SNA = [
  { value: 'SI',  label: 'Sí'  },
  { value: 'NO',  label: 'No'  },
  { value: 'N/A', label: 'N/A' },
];
const OPT_EST = [
  { value: 'VIGENTE',   label: 'Vigente'   },
  { value: 'VENCIDO',   label: 'Vencido'   },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'N/A',       label: 'N/A'       },
];

const CURSOS = [
  { label: 'BLS',              fecha: 'bls_fecha_venc',         estado: 'bls_estado'              },
  { label: 'ACLS',             fecha: 'acls_fecha_venc',        estado: 'acls_estado'             },
  { label: 'PALS',             fecha: 'pals_fecha_venc',        estado: 'pals_estado'             },
  { label: 'NALS',             fecha: 'nals_fecha_venc',        estado: 'nals_estado'             },
  { label: 'Radioprotección',  fecha: 'radioproteccion_fecha',  estado: 'radioproteccion_estado'  },
  { label: 'Violencia Sexual', fecha: 'violencia_sexual_fecha', estado: 'violencia_sexual_estado' },
  { label: 'Agentes Químicos', fecha: 'ataques_quimicos_fecha', estado: 'ataques_quimicos_estado' },
  { label: 'Dengue',           fecha: 'dengue_fecha',           estado: 'dengue_estado'           },
  { label: 'AIEPI',            fecha: 'aiepi_fecha',            estado: 'aiepi_estado'            },
  { label: 'Sedación',         fecha: 'sedacion_fecha',         estado: 'sedacion_estado'         },
  { label: 'Manejo Dolor',     fecha: 'manejo_dolor_fecha',     estado: 'manejo_dolor_estado'     },
  { label: 'Gestión Donante',  fecha: 'gestion_donante_fecha',  estado: 'gestion_donante_estado'  },
  { label: 'Gestión Duelo',    fecha: 'gestion_duelo_fecha',    estado: 'gestion_duelo_estado'    },
  { label: 'IAMII',            fecha: 'iamii_fecha',            estado: 'iamii_estado'            },
  { label: 'Telemedicina',     fecha: 'telemedicina_fecha',     estado: 'telemedicina_estado'     },
];

const ESTADO_COLOR = {
  'OK':         { bg: '#dcfce7', color: '#166534' },
  'Por vencer': { bg: '#fef9c3', color: '#854d0e' },
  'Vencido':    { bg: '#fee2e2', color: '#991b1b' },
};

const toDate = (v) => (!v ? '' : String(v).slice(0, 10));

const INIT_MED = {
  nombre_medico: '', categoria: '', especialidad: '', anios_cuerpo_medico: '',
};
const INIT_ACC = {
  induccion_general_chsm: '', induccion_his_isis: '', perfil_cargo: '', entrenamiento: '',
  estado_codigo: '', codigo_smm: '', estado_carnet: '', tarjeta_acceso: '',
  estado_bata: '', entrega_almera: '', entrega_ruaf: '', mipres: '',
  correo_corporativo: '', radio_expuesto: '', carta_turnos: '',
  poliza_resp_civil: '', fecha_venc_poliza: '', poliza_complicaciones: '',
};
const INIT_NORM = {
  ...Object.fromEntries(CURSOS.flatMap(c => [[c.fecha, ''], [c.estado, '']])),
  cursos_3_anios: '',
};

/* ── Componentes UI ─────────────────────────────────────────── */
function SectionCard({ title, icon, children }) {
  return (
    <div className="fm-section-card">
      <div className="fm-section-header">
        <span className="material-symbols-outlined fm-section-icon">{icon}</span>
        <span className="fm-section-title" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  );
}

function Campo({ label, name, value, onChange, error, required, placeholder, type = 'text', disabled }) {
  return (
    <div className="form-group fm-field">
      <label className={`form-label${required ? ' required' : ''}`} htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type}
        className={`form-input fm-input${error ? ' error' : ''}`}
        value={value ?? ''} onChange={onChange}
        placeholder={placeholder ?? ''} disabled={disabled}
      />
      {error && (
        <span className="form-hint fm-error" role="alert">
          <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>error</span>
          {error}
        </span>
      )}
    </div>
  );
}

function CampoSelect({ label, name, value, onChange, options = [], placeholder, required, disabled }) {
  return (
    <div className="form-group fm-field">
      <label className={`form-label${required ? ' required' : ''}`} htmlFor={name}>{label}</label>
      <div className="fm-select-wrap">
        <select
          id={name} name={name} className="form-select fm-select"
          value={value ?? ''} onChange={onChange} disabled={disabled}
        >
          <option value="">{placeholder ?? 'Seleccionar…'}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="material-symbols-outlined fm-select-arrow" style={{ fontSize: '1.125rem' }}>
          expand_more
        </span>
      </div>
    </div>
  );
}

/* ── Componente principal ───────────────────────────────────── */
export default function FormFSFB({ showToast }) {
  const navigate  = useNavigate();
  const { documento } = useParams();
  const isEdit = Boolean(documento);

  const [docFsfb,  setDocFsfb]  = useState('');
  const [med,      setMed]      = useState(INIT_MED);
  const [acc,      setAcc]      = useState(INIT_ACC);
  const [norm,     setNorm]     = useState(INIT_NORM);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);
  const [errors,   setErrors]   = useState({});
  const [rawCats,  setRawCats]  = useState([]);

  const optCats = useMemo(
    () => rawCats.map(c => ({ value: c.code, label: `${c.code} – ${c.nombre}` })),
    [rawCats],
  );

  /* ── Carga inicial ─────────────────────────────────────────── */
  useEffect(() => {
    axiosInstance.get('/maestras/categorias-metricas', { skipToast: true })
      .then(r => setRawCats(r.data ?? []))
      .catch(() => {});

    if (!isEdit) return;

    const load = async () => {
      try {
        const [rMed, rAcc, rNorm] = await Promise.allSettled([
          axiosInstance.get(`/medicos/${documento}/`,            { skipToast: true }),
          axiosInstance.get(`/medicos/${documento}/accesos/`,    { skipToast: true }),
          axiosInstance.get(`/medicos/${documento}/normativos/`, { skipToast: true }),
        ]);

        if (rMed.status === 'fulfilled') {
          const m = rMed.value.data ?? {};
          setMed({
            nombre_medico:       m.nombre_medico       ?? '',
            categoria:           m.categoria           ?? '',
            especialidad:        m.especialidad        ?? '',
            anios_cuerpo_medico: m.anios_cuerpo_medico ?? '',
          });
        }
        if (rAcc.status === 'fulfilled') {
          const a = rAcc.value.data ?? {};
          setAcc(Object.fromEntries(
            Object.keys(INIT_ACC).map(k => [k, k === 'fecha_venc_poliza' ? toDate(a[k]) : (a[k] ?? '')])
          ));
        }
        if (rNorm.status === 'fulfilled') {
          const n = rNorm.value.data ?? {};
          setNorm(Object.fromEntries(
            Object.keys(INIT_NORM).map(k => [k, k.endsWith('_fecha') || k.endsWith('_fecha_venc') ? toDate(n[k]) : (n[k] ?? '')])
          ));
        }
      } catch {
        showToast?.('Error cargando médico FSFB', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  const handleMed  = e => setMed(p  => ({ ...p, [e.target.name]: e.target.value }));
  const handleAcc  = e => setAcc(p  => ({ ...p, [e.target.name]: e.target.value }));
  const handleNorm = e => setNorm(p => ({ ...p, [e.target.name]: e.target.value }));

  const upsertSub = async (url, payload, docId) => {
    try {
      await axiosInstance.put(url, payload);
    } catch (err) {
      if (err.response?.status === 404) {
        await axiosInstance.post(url, { ...payload, documento_identidad: docId });
      } else throw err;
    }
  };

  /* ── Guardar ───────────────────────────────────────────────── */
  const handleSave = async () => {
    const errs = {};
    if (!med.nombre_medico?.trim()) errs.nombre_medico = 'Requerido';
    if (!isEdit && !docFsfb?.trim()) errs.docFsfb = 'Requerido';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const docId = isEdit ? documento : docFsfb.trim();
    setSaving(true);
    try {
      // 1. Medico principal
      const medicoPayload = {
        nombre_medico:       med.nombre_medico.trim(),
        categoria:           med.categoria           || null,
        especialidad:        med.especialidad        || null,
        anios_cuerpo_medico: med.anios_cuerpo_medico ? parseFloat(med.anios_cuerpo_medico) : null,
        tipo_listado:        'fsfb_externo',
        estado:              'ACTIVO',
      };
      if (isEdit) {
        await axiosInstance.put(`/medicos/${docId}/`, medicoPayload);
      } else {
        await axiosInstance.post('/medicos/', { ...medicoPayload, documento_identidad: docId });
      }

      // 2. Accesos
      const accPayload = Object.fromEntries(
        Object.entries(acc).map(([k, v]) => [k, v || null])
      );
      await upsertSub(`/medicos/${docId}/accesos/`, accPayload, docId);

      // 3. Normativos — solo fechas (estados los calcula el backend)
      const normPayload = Object.fromEntries(
        Object.entries(norm)
          .filter(([k]) => !k.endsWith('_estado'))
          .map(([k, v]) => [k, v || null])
      );
      await upsertSub(`/medicos/${docId}/normativos/`, normPayload, docId);

      showToast?.('Médico FSFB guardado correctamente', 'success');
      navigate('/medicos-fsfb', { state: { toast: 'Médico FSFB guardado' } });
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al guardar';
      showToast?.(Array.isArray(msg) ? msg.map(m => m.msg ?? JSON.stringify(m)).join(' · ') : msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Skeleton ──────────────────────────────────────────────── */
  if (loading) return (
    <div className="fm-root">
      <div className="fm-content">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14, marginBottom: 12 }} />
        ))}
      </div>
    </div>
  );

  return (
  <div className="fm-root">

     

      {/* ── Secciones ───────────────────────────────────────── */}
      <div className="fm-content fm-animate-in" style={{ paddingTop: '1rem' }}>

        {/* 1 · Identificación */}
        <SectionCard title="Identificación" icon="badge">
          <div className="fm-grid fm-grid-4">
            {!isEdit && (
              <Campo label="N.° Documento" name="docFsfb"
                value={docFsfb} onChange={e => setDocFsfb(e.target.value)}
                required error={errors.docFsfb} placeholder="Cédula del médico" />
            )}
            <div style={{ gridColumn: 'span 2' }}>
              <Campo label="Nombre del médico" name="nombre_medico"
                value={med.nombre_medico} onChange={handleMed}
                required error={errors.nombre_medico}
                placeholder="Nombres y apellidos completos" />
            </div>
            <CampoSelect label="Categoría" name="categoria"
              value={med.categoria} onChange={handleMed}
              options={optCats} placeholder="Seleccionar…" />
            <Campo label="Especialidad" name="especialidad"
              value={med.especialidad} onChange={handleMed}
              placeholder="Ej: Anestesiología" />
            <Campo label="Años en hospital" name="anios_cuerpo_medico" type="number"
              value={med.anios_cuerpo_medico} onChange={handleMed} placeholder="Ej: 5" />
          </div>
        </SectionCard>

        {/* 2 · Inducciones */}
        <SectionCard title="Inducciones y logística" icon="school">
          <div className="fm-grid fm-grid-4">
            <CampoSelect label="Inducción general CHSM" name="induccion_general_chsm"
              value={acc.induccion_general_chsm} onChange={handleAcc} options={OPT_SNA} />
            <CampoSelect label="Inducción HIS-ISIS" name="induccion_his_isis"
              value={acc.induccion_his_isis} onChange={handleAcc} options={OPT_SNA} />
            <CampoSelect label="Perfil de cargo" name="perfil_cargo"
              value={acc.perfil_cargo} onChange={handleAcc} options={OPT_SNA} />
            <CampoSelect label="Entrenamiento" name="entrenamiento"
              value={acc.entrenamiento} onChange={handleAcc} options={OPT_SNA} />
          </div>
        </SectionCard>

        {/* 3 · Acreditaciones */}
        <SectionCard title="Acreditaciones y accesos" icon="verified_user">
          <div className="fm-grid fm-grid-4">
            <CampoSelect label="Estado código" name="estado_codigo"
              value={acc.estado_codigo} onChange={handleAcc} options={OPT_EST} />
            <Campo label="Código SMM" name="codigo_smm"
              value={acc.codigo_smm} onChange={handleAcc} placeholder="Código asignado" />
            <CampoSelect label="Estado carnet" name="estado_carnet"
              value={acc.estado_carnet} onChange={handleAcc} options={OPT_EST} />
            <Campo label="Tarjeta de acceso" name="tarjeta_acceso"
              value={acc.tarjeta_acceso} onChange={handleAcc} />
            <CampoSelect label="Estado bata" name="estado_bata"
              value={acc.estado_bata} onChange={handleAcc} options={OPT_EST} />
            <CampoSelect label="Almera" name="entrega_almera"
              value={acc.entrega_almera} onChange={handleAcc} options={OPT_SNA} />
            <CampoSelect label="RUAF" name="entrega_ruaf"
              value={acc.entrega_ruaf} onChange={handleAcc} options={OPT_SNA} />
            <CampoSelect label="MIPRES" name="mipres"
              value={acc.mipres} onChange={handleAcc} options={OPT_SNA} />
            <div style={{ gridColumn: 'span 2' }}>
              <Campo label="Correo corporativo" name="correo_corporativo" type="email"
                value={acc.correo_corporativo} onChange={handleAcc}
                placeholder="correo@serena.com.co" />
            </div>
            <CampoSelect label="Radio expuesto" name="radio_expuesto"
              value={acc.radio_expuesto} onChange={handleAcc} options={OPT_SNA} />
            <CampoSelect label="Carta de turnos" name="carta_turnos"
              value={acc.carta_turnos} onChange={handleAcc} options={OPT_SNA} />
          </div>
        </SectionCard>

        {/* 4 · Pólizas */}
        <SectionCard title="Pólizas" icon="policy">
          <div className="fm-grid fm-grid-4">
            <CampoSelect label="Póliza resp. civil" name="poliza_resp_civil"
              value={acc.poliza_resp_civil} onChange={handleAcc} options={OPT_EST} />
            <Campo label="Vencimiento póliza" name="fecha_venc_poliza" type="date"
              value={acc.fecha_venc_poliza} onChange={handleAcc} />
            <CampoSelect label="Póliza complicaciones" name="poliza_complicaciones"
              value={acc.poliza_complicaciones} onChange={handleAcc} options={OPT_EST} />
          </div>
        </SectionCard>

        {/* 5 · Cursos normativos */}
        <SectionCard title="Cursos normativos" icon="workspace_premium">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '0.75rem',
          }}>
            {CURSOS.map(c => {
              const est = norm[c.estado];
              const ec  = ESTADO_COLOR[est];
              return (
                <div key={c.fecha} style={{
                  background: '#f8f9fb', borderRadius: 10,
                  border: '1px solid rgba(197,198,210,0.35)',
                  padding: '0.875rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700, color: '#0A2540',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {c.label}
                    </span>
                    {ec && (
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700,
                        padding: '2px 7px', borderRadius: 9999,
                        background: ec.bg, color: ec.color,
                      }}>
                        {est}
                      </span>
                    )}
                  </div>
                  <div className="form-group fm-field" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.6875rem' }}>Vencimiento</label>
                    <input
                      name={c.fecha} type="date"
                      className="form-input fm-input"
                      value={norm[c.fecha] ?? ''} onChange={handleNorm}
                      style={{ fontSize: '0.8125rem', padding: '5px 8px', height: 34 }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Cursos 3 años — solo SI/NO/N/A, sin fecha */}
            <div style={{
              background: '#f8f9fb', borderRadius: 10,
              border: '1px solid rgba(197,198,210,0.35)',
              padding: '0.875rem',
            }}>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, color: '#0A2540',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8,
              }}>
                Cursos 3 años
              </span>
              <CampoSelect label="Estado" name="cursos_3_anios"
                value={norm.cursos_3_anios} onChange={handleNorm} options={OPT_SNA} />
            </div>
          </div>
        </SectionCard>

      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={() => navigate('/medicos-fsfb')} disabled={saving}>
          <span className="material-symbols-outlined sm">arrow_back</span>Cancelar
        </button>
        <button className="btn btn-signature" onClick={handleSave} disabled={saving}>
          {saving
            ? <><span className="material-symbols-outlined sm" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>Guardando…</>
            : <><span className="material-symbols-outlined sm">save</span>Guardar</>
          }
        </button>
      </div>

    </div>
  );
}
