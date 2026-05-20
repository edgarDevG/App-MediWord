import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import FileUploadField from '../../components/shared/FileUploadField';

/* ══════════════════════════════════════════════════════════════
   Tab 2 v2: Carpeta HV y Prerrogativas
   CAMBIOS v2:
   - 2A: CAMPOS_INGRESO_FECHA — eliminado SimpleSelect, adjunto PDF por fila
         cuando la fecha está activa (botón Añadir)
   - 2B: Otros Documentos — select tipo + campo libre + adjunto por entrada
   - 2C: Estado General Prerrogativas — adjunto cuando hay estado seleccionado
   - 2D: PT solicitud + Ampliación respuesta SI → adjuntos
   Endpoints:
     GET/PUT/POST /medicos/{doc}/documentos-hv
     GET/PUT/POST /medicos/{doc}/prerrogativas
   ══════════════════════════════════════════════════════════════ */

const OPTSINO   = [
  { value: '', label: 'Seleccionar' },
  { value: 'SI', label: 'Sí' },
  { value: 'N/A', label: 'N/a' },
  { value: 'PENDIENTE', label: 'Pendiente' },
];

const OPTESTPRE = [
  { value: '', label: 'Seleccionar' },
  { value: 'Prerrogativas Definitivas CME', label: 'Prerrogativas Definitivas CME' },
  { value: 'Prerrogativas Definitivas CME - Extensión HUFSFB', label: 'Prerrogativas Definitivas CME - Extensión HUFSFB' },
  { value: 'Prerrogativas Definitivas CME - Caso Extraordinario', label: 'Prerrogativas Definitivas CME - Caso Extraordinario' },
  { value: 'Prerrogativas Temporales', label: 'No Prerrogativas Temporales' },
];

/* 2B: tipos predefinidos para otros documentos de ingreso */
const TIPOS_OTROS_DOCS = [
  'Carta Institucionalidad',
  'Carta Cód. Conducta',
  'Carta Cód. Ingreso',
  'Cert. Enr. Mod. Med.',
  'Carta Rec. Mod. Med.',
  '__libre__',   // sentinel para nombre libre
];
const LABEL_TIPO = (v) => v === '__libre__' ? 'Otro (nombre libre)' : v;

const CAMPOS_INGRESO_FECHA = [
  { docKey: 'formsolingreso',        fechaKey: 'fechaformsolingreso',    label: 'Formulario Solicitud Ingreso'      },
  { docKey: 'formcapeducacion',      fechaKey: 'fechaformcapeducacion',  label: 'Formulario Capacitación Educación' },
  { docKey: 'cartaprescoorddpto',    fechaKey: 'fechacartaprescoorddpto',label: 'Carta Coord. Departamento'         },
  { docKey: 'cartaprescoordseccion', fechaKey: 'fechacartaprescoordsecc',label: 'Carta Coord. Sección'              },
  { docKey: 'cartaaspirante',        fechaKey: 'fechacartaaspirante',    label: 'Carta Aspirante'                   },
  { docKey: 'cartarecomendacion1',   fechaKey: 'fecharecomendacion1',    label: 'Carta Recomendación 1'             },
  { docKey: 'cartarecomendacion2',   fechaKey: 'fecharecomendacion2',    label: 'Carta Recomendación 2'             },
  { docKey: 'cartapresdm',           fechaKey: 'fechapresdm',            label: 'Carta Presentación DM'             },
];

const toDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

/* Estado inicial HV — sin los docKeys de select (eliminados en 2A) */
const buildInitHV = () => {
  const init = {
    cartainstitucionalidad: '',
    cartacodconducta: '',
    cartapresdm: '',
    otrosdocs: [],   // 2B: array de { id, tipo, nombreLibre }
  };
  CAMPOS_INGRESO_FECHA.forEach(f => { init[f.fechaKey] = null; });
  return init;
};

const buildInitPre = () => ({
  estadoprerrogativas: '',
  fechaaprovdefinitiva: null,
  prertemporalessolicitud: '',       fechaprertemporalessolicitud: null,
  prertemporalesrespuesta: '',       fechaprertemporalesrespuesta: null,
  fechaprertemporalesinicio: null,   fechaprertemporalesfin: null,
  prertemporalesnoticord: '',
  amplprertemporalessolicitud: '',   amplprertemporalesrespuesta: '',
  fechaampliacionaprobada: null,     // 2D: nuevo campo fecha
  cartaauthcredenciales: '',         fechacartaauthcredenciales: null,
  cartaauthingresocme: '',           fechacartaauthingresocme: null,
  notificacioningresoprofesional: '',
  certentregamodelomedico: '',
  cartareceptdocmodelomedico: '',
  declaracionconflictointereses: '',
});

/* ── Sub-componentes ── */
function SectionCard({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: '#ffffff', border: '1px solid rgba(197,198,210,0.4)',
      borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)', overflow: 'hidden',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f8fafc', cursor: 'pointer', borderBottom: open ? '1px solid rgba(197,198,210,0.4)' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(26,78,215,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>{icon}</span>
          </div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</h4>
        </div>
        <span className="material-symbols-outlined" style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>expand_more</span>
      </div>
      {open && <div style={{ padding: '1.5rem' }}>{children}</div>}
    </div>
  );
}

function SubGroup({ title, children }) {
  return (
    <div style={{
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      marginBottom: '1rem',
      background: '#fafafa',
    }}>
      <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', marginBottom: '1rem', textTransform: 'uppercase' }}>
        {title}
      </h5>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

function SimpleSelect({ label, value, onChange, options }) {
  return (
    <div className="form-group" style={{ flex: '1 1 200px' }}>
      {label && <label className="form-label">{label}</label>}
      <select className="form-select" value={value ?? ''} onChange={onChange}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SimpleInput({ label, value, onChange, placeholder }) {
  return (
    <div className="form-group" style={{ flex: '1 1 200px' }}>
      {label && <label className="form-label">{label}</label>}
      <input type="text" className="form-input" value={value ?? ''} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function CampoFechaNullable({ label, fieldKey, value, onChangeFn }) {
  const esNA = value === null;
  return (
    <div className="form-group" style={{ flex: '1 1 160px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        {label && <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>}
        <button type="button"
          onClick={() => onChangeFn(fieldKey, esNA ? '' : null)}
          style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: esNA ? 'rgba(148,163,184,0.15)' : 'rgba(26,78,215,0.1)', color: esNA ? '#64748b' : 'var(--color-primary)', transition: 'all 160ms' }}>
          {esNA ? 'Añadir' : 'Quitar'}
        </button>
      </div>
      {esNA
        ? <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(241,245,249,0.5)', border: '1px dashed #cbd5e1', fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center' }}>N/A</div>
        : <input type="date" className="form-input" value={value ?? ''} onChange={e => onChangeFn(fieldKey, e.target.value || null)} />
      }
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════ */
export default function Tab2Habilitacion({ medicoDoc, onNext, onPrev, markCompleted }) {
  const [hv,        setHv]        = useState(buildInitHV);
  const [pre,       setPre]       = useState(buildInitPre);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const chgHv  = (field, value) => setHv(p  => ({ ...p, [field]: value }));
  const chgPre = (field, value) => setPre(p => ({ ...p, [field]: value }));

  /* ── Carga datos ── */
  useEffect(() => {
    if (!medicoDoc) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [rHv, rPre] = await Promise.allSettled([
          axiosInstance.get(`/medicos/${medicoDoc}/documentos-hv/`,  { skipToast: true }),
          axiosInstance.get(`/medicos/${medicoDoc}/prerrogativas/`, { skipToast: true }),
        ]);
        if (cancelled) return;

        const dHv  = rHv.status  === 'fulfilled' ? rHv.value.data  : {};
        const dPre = rPre.status === 'fulfilled' ? rPre.value.data : {};

        /* 2B: reconstruir otrosdocs desde los campos serializados */
        const otrosDocs = [];
        if (dHv.carta_institucionalidad) otrosDocs.push({ id: `ci-${Date.now()}`,  tipo: 'Carta Institucionalidad', nombreLibre: '' });
        if (dHv.carta_cod_conducta)      otrosDocs.push({ id: `cc-${Date.now()}`,  tipo: 'Carta Cód. Conducta',     nombreLibre: '' });
        if (dHv.otros_docs_ingreso)      otrosDocs.push({ id: `ot-${Date.now()}`,  tipo: '__libre__',               nombreLibre: dHv.otros_docs_ingreso });

        setHv(prev => ({
          ...prev,
          otrosdocs:               otrosDocs,
          fechaformsolingreso:     toDate(dHv.fecha_form_sol_ingreso) || null,
          fechaformcapeducacion:   toDate(dHv.fecha_form_cap)         || null,
          fechacartaprescoorddpto: toDate(dHv.fecha_carta_coord_dpto) || null,
          fechacartaprescoordsecc: toDate(dHv.fecha_carta_coord_sec)  || null,
          fechacartaaspirante:     toDate(dHv.fecha_carta_aspirante)  || null,
          fecharecomendacion1:     toDate(dHv.fecha_carta_recom1)     || null,
          fecharecomendacion2:     toDate(dHv.fecha_carta_recom2)     || null,
          fechapresdm:             toDate(dHv.fecha_presentacion_dm)  || null,
        }));

        setPre(prev => ({
          ...prev,
          estadoprerrogativas:            dPre.estado_prerrogativas           ?? '',
          fechaaprovdefinitiva:           toDate(dPre.fecha_aprobacion_definitivas) || null,
          prertemporalessolicitud:        dPre.pt_solicitud                  ?? '',
          fechaprertemporalessolicitud:   toDate(dPre.pt_fecha_solicitud)    || null,
          prertemporalesrespuesta:        dPre.pt_respuesta                  ?? '',
          fechaprertemporalesrespuesta:   toDate(dPre.pt_fecha_respuesta)    || null,
          fechaprertemporalesinicio:      toDate(dPre.pt_fecha_inicio)       || null,
          fechaprertemporalesfin:         toDate(dPre.pt_fecha_fin)          || null,
          prertemporalesnoticord:         dPre.pt_notif_coord                ?? '',
          amplprertemporalessolicitud:    dPre.amp_pt_solicitud              ?? '',
          amplprertemporalesrespuesta:    dPre.amp_pt_respuesta              ?? '',
          fechaampliacionaprobada:        toDate(dPre.amp_pt_fecha_aprobada) || null,
          cartaauthcredenciales:          dPre.carta_aut_credenciales        ?? '',
          fechacartaauthcredenciales:     toDate(dPre.fecha_carta_aut_cred)  || null,
          cartaauthingresocme:            dPre.carta_aut_ingreso_cme         ?? '',
          fechacartaauthingresocme:       toDate(dPre.fecha_carta_aut_cme)   || null,
          notificacioningresoprofesional: dPre.notif_ingreso_profesional     ?? '',
          certentregamodelomedico:        dPre.cert_entrega_modelo_medico    ?? '',
          cartareceptdocmodelomedico:     dPre.carta_recepcion_docs          ?? '',
          declaracionconflictointereses:  dPre.declaracion_conflicto         ?? '',
        }));
      } catch (e) {
        console.error('[Tab2] load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [medicoDoc]);

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
  const handleNext = async () => {
    setSaving(true); setSaveError(null);
    try {
      /* 2B: serializar otrosdocs de vuelta a campos legacy */
      const docInst  = hv.otrosdocs.find(d => d.tipo === 'Carta Institucionalidad');
      const docCond  = hv.otrosdocs.find(d => d.tipo === 'Carta Cód. Conducta');
      const docLibre = hv.otrosdocs.filter(d => d.tipo === '__libre__').map(d => d.nombreLibre).filter(Boolean).join('; ');

      const hvPayload = {
        carta_institucionalidad:   docInst  ? 'SI' : null,
        carta_cod_conducta:        docCond  ? 'SI' : null,
        carta_presentacion_dm:     null,   // mantenido para compatibilidad
        otros_docs_ingreso:        docLibre || null,
        fecha_form_sol_ingreso:    hv.fechaformsolingreso       || null,
        fecha_form_cap:            hv.fechaformcapeducacion     || null,
        fecha_carta_coord_dpto:    hv.fechacartaprescoorddpto   || null,
        fecha_carta_coord_sec:     hv.fechacartaprescoordsecc   || null,
        fecha_carta_aspirante:     hv.fechacartaaspirante       || null,
        fecha_carta_recom1:        hv.fecharecomendacion1       || null,
        fecha_carta_recom2:        hv.fecharecomendacion2       || null,
        fecha_presentacion_dm:     hv.fechapresdm               || null,
      };

      const prePayload = {
        estado_prerrogativas:           pre.estadoprerrogativas            || null,
        fecha_aprobacion_definitivas:   pre.fechaaprovdefinitiva           || null,
        pt_solicitud:                   pre.prertemporalessolicitud        || null,
        pt_fecha_solicitud:             pre.fechaprertemporalessolicitud   || null,
        pt_respuesta:                   pre.prertemporalesrespuesta        || null,
        pt_fecha_respuesta:             pre.fechaprertemporalesrespuesta   || null,
        pt_inicio:                      null,
        pt_fecha_inicio:                pre.fechaprertemporalesinicio      || null,
        pt_fecha_fin:                   pre.fechaprertemporalesfin         || null,
        pt_notif_coord:                 pre.prertemporalesnoticord         || null,
        amp_pt_solicitud:               pre.amplprertemporalessolicitud    || null,
        amp_pt_respuesta:               pre.amplprertemporalesrespuesta    || null,
        amp_pt_fecha_aprobada:          pre.fechaampliacionaprobada        || null,
        carta_aut_credenciales:         pre.cartaauthcredenciales          || null,
        fecha_carta_aut_cred:           pre.fechacartaauthcredenciales     || null,
        carta_aut_ingreso_cme:          pre.cartaauthingresocme            || null,
        fecha_carta_aut_cme:            pre.fechacartaauthingresocme       || null,
        notif_ingreso_profesional:      pre.notificacioningresoprofesional || null,
        cert_entrega_modelo_medico:     pre.certentregamodelomedico        || null,
        declaracion_conflicto:          pre.declaracionconflictointereses  || null,
      };

      await Promise.all([
        upsert(`/medicos/${medicoDoc}/documentos-hv/`,  hvPayload),
        upsert(`/medicos/${medicoDoc}/prerrogativas/`, prePayload),
      ]);

      markCompleted(2);
      onNext();
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al guardar. Intenta de nuevo.';
      setSaveError(Array.isArray(msg) ? msg.map(m => m.msg ?? JSON.stringify(m)).join(' · ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  /* ── Handlers otros docs (2B) ── */
  const addOtroDoc = () => {
    setHv(p => ({
      ...p,
      otrosdocs: [...p.otrosdocs, { id: `nd-${Date.now()}`, tipo: '', nombreLibre: '' }],
    }));
  };
  const removeOtroDoc = (id) => setHv(p => ({ ...p, otrosdocs: p.otrosdocs.filter(d => d.id !== id) }));
  const chgOtroDoc = (id, field, val) => setHv(p => ({
    ...p,
    otrosdocs: p.otrosdocs.map(d => d.id === id ? { ...d, [field]: val } : d),
  }));

  /* ── Skeleton ── */
  if (loading) return (
    <div style={{ padding: '3rem 2.5rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 12, background: '#e2e8f0' }} />
      ))}
    </div>
  );

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 148px)' }}>
      <div style={{ flex: 1, padding: '3rem 2.5rem', maxWidth: 1620, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.01em' }}>
            Documentos de ingreso y Prerrogativas
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
            Documentos de ingreso al cuerpo médico y estado de prerrogativas institucionales.
          </p>
        </div>

        {saveError && (
          <div role="alert" style={{ background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-error)', flexShrink: 0 }}>error</span>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-error)', fontWeight: 500 }}>{saveError}</p>
          </div>
        )}

        {/* ═══ SECCIÓN 1 — DOCUMENTOS DE INGRESO ═══ */}
        <SectionCard title="Documentos de Ingreso" icon="folder_open" defaultOpen={true}>

          {/* 2A: tabla sin select, con adjunto condicional */}
          <div style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: 'rgba(248,250,252,0.5)', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', margin: 0 }}>
                LISTADO DE DOCUMENTOS (Formatos y Cartas)
              </p>
            </div>

            {CAMPOS_INGRESO_FECHA.map((row, idx) => {
              const fechaActiva = hv[row.fechaKey] !== null;
              return (
                <div key={row.docKey} style={{
                  display: 'grid',
                  gridTemplateColumns: fechaActiva ? '2fr 200px 1fr' : '2fr 200px',
                  gap: '20px',
                  alignItems: 'center',
                  padding: '12px 20px',
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: idx === CAMPOS_INGRESO_FECHA.length - 1 ? 'none' : '1px solid rgba(148,163,184,0.1)',
                  transition: 'all 200ms',
                }}>
                  {/* Nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#cbd5e1' }}>description</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-on-surface)' }}>
                      {row.label}
                    </span>
                  </div>

                  {/* Fecha (botón Añadir/Quitar) */}
                  <div style={{ marginTop: -16 }}>
                    <CampoFechaNullable
                      fieldKey={row.fechaKey}
                      value={hv[row.fechaKey]}
                      onChangeFn={chgHv}
                    />
                  </div>

                  {/* Adjunto — solo visible cuando fecha activa */}
                  {fechaActiva && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FileUploadField
                        carpeta="ingreso"
                        maxArchivos={1}
                        medicoDoc={medicoDoc}
                        campoRef={row.fechaKey}
                        compact
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2B: Otros documentos de ingreso */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              background: '#fafafa',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
                  Otros Documentos de Ingreso
                </h5>
                <button
                  type="button"
                  onClick={addOtroDoc}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 'var(--radius-full)',
                    border: '1px dashed rgba(26,78,215,0.4)',
                    background: 'transparent', color: 'var(--color-secondary)',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 160ms',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  Añadir documento
                </button>
              </div>

              {hv.otrosdocs.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 6, opacity: 0.4 }}>folder_open</span>
                  Sin documentos adicionales. Pulsa "Añadir documento" para agregar.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {hv.otrosdocs.map((doc) => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap',
                    padding: '0.75rem 1rem',
                    background: '#fff',
                    border: '1px solid rgba(197,198,210,0.4)',
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    {/* Select tipo */}
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                      <label className="form-label">Tipo de documento</label>
                      <select
                        className="form-select"
                        value={doc.tipo}
                        onChange={e => chgOtroDoc(doc.id, 'tipo', e.target.value)}
                      >
                        <option value="">Seleccionar tipo…</option>
                        {TIPOS_OTROS_DOCS.map(t => (
                          <option key={t} value={t}>{LABEL_TIPO(t)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nombre libre si aplica */}
                    {doc.tipo === '__libre__' && (
                      <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label">Nombre del documento</label>
                        <input
                          type="text"
                          className="form-input"
                          value={doc.nombreLibre}
                          onChange={e => chgOtroDoc(doc.id, 'nombreLibre', e.target.value)}
                          placeholder="Ej: Certificado de buena conducta…"
                        />
                      </div>
                    )}

                    {/* Adjunto */}
                    <div style={{ flex: '0 0 auto', paddingBottom: 2 }}>
                      <FileUploadField
                        carpeta="ingreso"
                        maxArchivos={1}
                        medicoDoc={medicoDoc}
                        campoRef={`otro_doc_${doc.id}`}
                        compact
                        label=""
                      />
                    </div>

                    {/* Eliminar entrada */}
                    <button
                      type="button"
                      onClick={() => removeOtroDoc(doc.id)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', padding: '6px', borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', flexShrink: 0,
                        transition: 'color 160ms, background 160ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'rgba(186,26,26,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                      title="Eliminar entrada"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ═══ SECCIÓN 2 — PRERROGATIVAS ═══ */}
        <SectionCard title="Prerrogativas Institucionales" icon="verified_user" defaultOpen={true}>

          {/* 2C: Estado General */}
          <SubGroup title="Estado General">
            <SimpleSelect
              label="Estado prerrogativas"
              value={pre.estadoprerrogativas ?? ''}
              onChange={e => chgPre('estadoprerrogativas', e.target.value)}
              options={OPTESTPRE}
            />
            <CampoFechaNullable
              label="Fecha aprobación definitiva"
              fieldKey="fechaaprovdefinitiva"
              value={pre.fechaaprovdefinitiva}
              onChangeFn={chgPre}
            />

            {/* Adjunto si hay estado seleccionado */}
            {pre.estadoprerrogativas !== '' && (
              <div style={{ width: '100%', marginTop: 4 }}>
                <FileUploadField
                  carpeta="prerrogativas"
                  maxArchivos={1}
                  medicoDoc={medicoDoc}
                  campoRef="estadoprerrogativas"
                  label="Soporte estado prerrogativas"
                />
              </div>
            )}
          </SubGroup>

          {/* 2D: Prerrogativas Temporales */}
          <SubGroup title="Prerrogativas Temporales (PT)">
            <SimpleSelect
              label="Solicitud PT"
              value={pre.prertemporalessolicitud ?? ''}
              onChange={e => chgPre('prertemporalessolicitud', e.target.value)}
              options={OPTSINO}
            />
            <CampoFechaNullable
              label="Fecha Solicitud"
              fieldKey="fechaprertemporalessolicitud"
              value={pre.fechaprertemporalessolicitud}
              onChangeFn={chgPre}
            />

            {/* Adjunto PT si solicitud = SI */}
            {pre.prertemporalessolicitud === 'SI' && (
              <div style={{ width: '100%', marginTop: 4 }}>
                <FileUploadField
                  carpeta="prerrogativas"
                  maxArchivos={1}
                  medicoDoc={medicoDoc}
                  campoRef="prertemporalessolicitud"
                  label="Soporte solicitud PT"
                />
              </div>
            )}

            <SimpleSelect
              label="Respuesta PT"
              value={pre.prertemporalesrespuesta ?? ''}
              onChange={e => chgPre('prertemporalesrespuesta', e.target.value)}
              options={OPTSINO}
            />
            <CampoFechaNullable
              label="Fecha Respuesta"
              fieldKey="fechaprertemporalesrespuesta"
              value={pre.fechaprertemporalesrespuesta}
              onChangeFn={chgPre}
            />

            <CampoFechaNullable label="Fecha Inicio PT"  fieldKey="fechaprertemporalesinicio" value={pre.fechaprertemporalesinicio} onChangeFn={chgPre} />
            <CampoFechaNullable label="Fecha Fin PT"     fieldKey="fechaprertemporalesfin"    value={pre.fechaprertemporalesfin}    onChangeFn={chgPre} />

            <SimpleInput
              label="Notificación Coord. PT"
              value={pre.prertemporalesnoticord ?? ''}
              onChange={e => chgPre('prertemporalesnoticord', e.target.value)}
              placeholder="Detalles notificación..."
            />

            <div style={{ width: '100%', height: '1px', background: 'rgba(148,163,184,0.2)', margin: '0.5rem 0' }} />

            {/* Ampliación PT */}
            <SimpleSelect
              label="Solicitud ampliación PT"
              value={pre.amplprertemporalessolicitud ?? ''}
              onChange={e => chgPre('amplprertemporalessolicitud', e.target.value)}
              options={OPTSINO}
            />
            <SimpleSelect
              label="Respuesta ampliación PT"
              value={pre.amplprertemporalesrespuesta ?? ''}
              onChange={e => chgPre('amplprertemporalesrespuesta', e.target.value)}
              options={OPTSINO}
            />

            {/* 2D: cuando respuesta ampliación = SI → 3er campo + adjunto */}
            {pre.amplprertemporalesrespuesta === 'SI' && (
              <>
                <CampoFechaNullable
                  label="Fecha aprobación ampliación"
                  fieldKey="fechaampliacionaprobada"
                  value={pre.fechaampliacionaprobada}
                  onChangeFn={chgPre}
                />
                <div style={{ width: '100%', marginTop: 4 }}>
                  <FileUploadField
                    carpeta="prerrogativas"
                    maxArchivos={1}
                    medicoDoc={medicoDoc}
                    campoRef="amplprertemporalesrespuesta"
                    label="Soporte respuesta ampliación PT"
                  />
                </div>
              </>
            )}
          </SubGroup>

          <SubGroup title="Autorizaciones, Notificaciones y Certificados">
            <SimpleSelect label="Aut. credenciales"         value={pre.cartaauthcredenciales ?? ''}           onChange={e => chgPre('cartaauthcredenciales', e.target.value)}          options={OPTSINO} />
            <CampoFechaNullable label="Fecha aut. credenciales"  fieldKey="fechacartaauthcredenciales"  value={pre.fechacartaauthcredenciales}  onChangeFn={chgPre} />
            <SimpleSelect label="Aut. ingreso CME"          value={pre.cartaauthingresocme ?? ''}             onChange={e => chgPre('cartaauthingresocme', e.target.value)}            options={OPTSINO} />
            <CampoFechaNullable label="Fecha aut. ingreso CME"   fieldKey="fechacartaauthingresocme"    value={pre.fechacartaauthingresocme}    onChangeFn={chgPre} />
            <SimpleSelect label="Notif. ingreso profesional" value={pre.notificacioningresoprofesional ?? ''} onChange={e => chgPre('notificacioningresoprofesional', e.target.value)} options={OPTSINO} />
            <SimpleSelect label="Cert. entrega modelo médico" value={pre.certentregamodelomedico ?? ''}       onChange={e => chgPre('certentregamodelomedico', e.target.value)}        options={OPTSINO} />
            <SimpleSelect label="Carta recept. doc. modelo"  value={pre.cartareceptdocmodelomedico ?? ''}    onChange={e => chgPre('cartareceptdocmodelomedico', e.target.value)}     options={OPTSINO} />
            <SimpleSelect label="Decl. conflicto intereses"  value={pre.declaracionconflictointereses ?? ''} onChange={e => chgPre('declaracionconflictointereses', e.target.value)}  options={OPTSINO} />
          </SubGroup>

        </SectionCard>

      </div>

      {/* ── Footer ── */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={onPrev} disabled={saving}>
          <span className="material-symbols-outlined sm">arrow_back</span>
          Datos del Médico
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 'inherit' }}>
          {saving && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined sm" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
              Guardando…
            </span>
          )}
          <button className="btn btn-signature" onClick={handleNext} disabled={saving}>
            Guardar y continuar
            <span className="material-symbols-outlined sm">arrow_forward</span>
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
