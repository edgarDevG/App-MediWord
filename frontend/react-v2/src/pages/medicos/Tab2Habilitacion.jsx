import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   Tab 2: Carpeta HV y Prerrogativas
   Endpoints:
     GET/PUT/POST /medicos/{doc}/documentos-hv
     GET/PUT/POST /medicos/{doc}/prerrogativas
   ══════════════════════════════════════════════════════════════ */

const OPTSINO   = [{ value: '', label: 'Seleccionar' }, { value: 'SI', label: 'Sí' }, { value: 'NO', label: 'No' }, { value: 'PENDIENTE', label: 'Pendiente' }];
const OPTESTPRE = [
  { value: '', label: 'Seleccionar' },
  { value: 'VIGENTE',  label: 'Vigente'   },
  { value: 'VENCIDA',  label: 'Vencida'   },
  { value: 'TEMPORAL', label: 'Temporal'  },
  { value: 'NOAPLICA', label: 'No aplica' },
];

const CAMPOS_INGRESO_FECHA = [
  { docKey: 'formsolingreso',       fechaKey: 'fechaformsolingreso',    label: 'Form. solicitud ingreso'      },
  { docKey: 'formcapeducacion',     fechaKey: 'fechaformcapeducacion',  label: 'Form. capacitación educación' },
  { docKey: 'cartaprescoorddpto',   fechaKey: 'fechacartaprescoorddpto',label: 'Carta coord. departamento'    },
  { docKey: 'cartaprescoordseccion',fechaKey: 'fechacartaprescoordsecc',label: 'Carta coord. sección'         },
  { docKey: 'cartaaspirante',       fechaKey: 'fechacartaaspirante',    label: 'Carta aspirante'              },
  { docKey: 'cartarecomendacion1',  fechaKey: 'fecharecomendacion1',    label: 'Carta recomendación 1'        },
  { docKey: 'cartarecomendacion2',  fechaKey: 'fecharecomendacion2',    label: 'Carta recomendación 2'        },
  { docKey: 'cartapresdm',          fechaKey: 'fechapresdm',            label: 'Carta presentación DM'        },
  // Auth. credenciales y Auth. ingreso CME se gestionan en la sección Prerrogativas
];

const toDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

const buildInitHV = () => {
  const init = {
    formsolingreso: '', formcapeducacion: '', cartaprescoorddpto: '',
    cartaprescoordseccion: '', cartaaspirante: '', cartarecomendacion1: '',
    cartarecomendacion2: '', cartainstitucionalidad: '', cartacodconducta: '',
    cartapresdm: '', otrosdocumentosrelacionados: '',
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
      background: 'var(--color-surface, #fff)', border: '1px solid rgba(26,78,215,0.09)',
      borderRadius: 12, marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(26,78,215,0.05)',
    }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 20px', background: 'none', border: 'none',
        cursor: 'pointer', borderBottom: open ? '1px solid rgba(26,78,215,0.07)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary, #1a4ed7)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-on-surface, #1e293b)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>expand_more</span>
      </button>
      {open && <div style={{ padding: 20 }}>{children}</div>}
    </div>
  );
}

function SimpleSelect({ label, value, onChange, options }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-select" value={value ?? ''} onChange={onChange}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SimpleInput({ label, value, onChange, placeholder }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input type="text" className="form-input" value={value ?? ''} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

function CampoFechaNullable({ label, fieldKey, value, onChangeFn }) {
  const esNA = value === null;
  return (
    <div className="form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        {label && <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>}
        <button type="button"
          onClick={() => onChangeFn(fieldKey, esNA ? '' : null)}
          style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '1px 8px', borderRadius: 9999, border: 'none', cursor: 'pointer', background: esNA ? 'rgba(148,163,184,0.20)' : 'rgba(26,78,215,0.08)', color: esNA ? '#64748b' : 'var(--color-primary, #1a4ed7)', transition: 'all 160ms' }}>
          {esNA ? 'Agregar fecha' : 'N/A'}
        </button>
      </div>
      {esNA
        ? <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(148,163,184,0.08)', border: '1px dashed rgba(148,163,184,0.3)', fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center' }}>No aplica — fecha nula</div>
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

        setHv(prev => ({
          ...prev,
          formsolingreso:            dHv.form_sol_ingreso          ?? '',
          formcapeducacion:          dHv.form_cap_educacion        ?? '',
          cartaprescoorddpto:        dHv.carta_pres_coord_dpto     ?? '',
          cartaprescoordseccion:     dHv.carta_pres_coord_seccion  ?? '',
          cartaaspirante:            dHv.carta_aspirante           ?? '',
          cartarecomendacion1:       dHv.carta_recomendacion_1     ?? '',
          cartarecomendacion2:       dHv.carta_recomendacion_2     ?? '',
          cartainstitucionalidad:    dHv.carta_institucionalidad   ?? '',
          cartacodconducta:          dHv.carta_cod_conducta        ?? '',
          cartapresdm:               dHv.carta_presentacion_dm     ?? '',
          otrosdocumentosrelacionados: dHv.otros_docs_ingreso      ?? '',
          fechaformsolingreso:       toDate(dHv.fecha_form_sol_ingreso) || null,
          fechaformcapeducacion:     toDate(dHv.fecha_form_cap)         || null,
          fechacartaprescoorddpto:   toDate(dHv.fecha_carta_coord_dpto) || null,
          fechacartaprescoordsecc:   toDate(dHv.fecha_carta_coord_sec)  || null,
          fechacartaaspirante:       toDate(dHv.fecha_carta_aspirante)  || null,
          fecharecomendacion1:       toDate(dHv.fecha_carta_recom1)     || null,
          fecharecomendacion2:       toDate(dHv.fecha_carta_recom2)     || null,
          fechapresdm:               toDate(dHv.fecha_presentacion_dm)  || null,
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
          cartaauthcredenciales:          dPre.carta_aut_credenciales        ?? '',
          fechacartaauthcredenciales:     toDate(dPre.fecha_carta_aut_cred)  || null,
          cartaauthingresocme:            dPre.carta_aut_ingreso_cme         ?? '',
          fechacartaauthingresocme:       toDate(dPre.fecha_carta_aut_cme)   || null,
          notificacioningresoprofesional: dPre.notif_ingreso_profesional     ?? '',
          certentregamodelomedico:        dPre.cert_entrega_modelo_medico    ?? '',
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
      const hvPayload = {
        form_sol_ingreso:          hv.formsolingreso            || null,
        form_cap_educacion:        hv.formcapeducacion          || null,
        carta_pres_coord_dpto:     hv.cartaprescoorddpto        || null,
        carta_pres_coord_seccion:  hv.cartaprescoordseccion     || null,
        carta_aspirante:           hv.cartaaspirante            || null,
        carta_recomendacion_1:     hv.cartarecomendacion1       || null,
        carta_recomendacion_2:     hv.cartarecomendacion2       || null,
        carta_institucionalidad:   hv.cartainstitucionalidad    || null,
        carta_cod_conducta:        hv.cartacodconducta          || null,
        carta_presentacion_dm:     hv.cartapresdm               || null,
        otros_docs_ingreso:        hv.otrosdocumentosrelacionados || null,
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

  /* ── Skeleton ── */
  if (loading) return (
    <div style={{ padding: '3rem 2.5rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12, marginBottom: 12 }} />
      ))}
    </div>
  );

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 148px)' }}>
      <div style={{ flex: 1, padding: '3rem 2.5rem', maxWidth: 1620, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.01em' }}>
            Carpeta HV y Prerrogativas
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
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', marginBottom: 14 }}>
            ESTADO Y FECHAS — Las fechas sin información quedan como N/A (null)
          </p>

          {CAMPOS_INGRESO_FECHA.map(row => (
            <div key={row.docKey} style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 180px', gap: 12,
              alignItems: 'end', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.10)',
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-on-surface, #1e293b)', paddingBottom: 4 }}>
                {row.label}
              </span>
              <SimpleSelect value={hv[row.docKey] ?? ''}
                onChange={e => chgHv(row.docKey, e.target.value)} options={OPTSINO} />
              <CampoFechaNullable fieldKey={row.fechaKey}
                value={hv[row.fechaKey]} onChangeFn={chgHv} />
            </div>
          ))}

          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { k: 'cartainstitucionalidad', l: 'Carta institucionalidad'  },
              { k: 'cartacodconducta',       l: 'Carta cód. conducta'      },
            ].map(item => (
              <div key={item.k} style={{ flex: '1 1 220px' }}>
                <SimpleSelect label={item.l} value={hv[item.k] ?? ''}
                  onChange={e => chgHv(item.k, e.target.value)} options={OPTSINO} />
              </div>
            ))}
            <div style={{ flex: '1 1 300px' }}>
              <SimpleInput label="Otros documentos relacionados"
                value={hv.otrosdocumentosrelacionados}
                onChange={e => chgHv('otrosdocumentosrelacionados', e.target.value)}
                placeholder="Notas adicionales..." />
            </div>
          </div>
        </SectionCard>

        {/* ═══ SECCIÓN 2 — PRERROGATIVAS ═══ */}
        <SectionCard title="Prerrogativas" icon="verified_user" defaultOpen={false}>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
            <div style={{ flex: '1 1 200px' }}>
              <SimpleSelect label="Estado prerrogativas" value={pre.estadoprerrogativas ?? ''}
                onChange={e => chgPre('estadoprerrogativas', e.target.value)} options={OPTESTPRE} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <CampoFechaNullable label="Fecha aprobación definitiva"
                fieldKey="fechaaprovdefinitiva" value={pre.fechaaprovdefinitiva} onChangeFn={chgPre} />
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', margin: '16px 0 10px' }}>
            PRERROGATIVAS TEMPORALES
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 180px' }}>
              <SimpleSelect label="Solicitud PT" value={pre.prertemporalessolicitud ?? ''}
                onChange={e => chgPre('prertemporalessolicitud', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <CampoFechaNullable label="Fecha solicitud PT"
                fieldKey="fechaprertemporalessolicitud" value={pre.fechaprertemporalessolicitud} onChangeFn={chgPre} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <SimpleSelect label="Respuesta PT" value={pre.prertemporalesrespuesta ?? ''}
                onChange={e => chgPre('prertemporalesrespuesta', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <CampoFechaNullable label="Fecha respuesta PT"
                fieldKey="fechaprertemporalesrespuesta" value={pre.fechaprertemporalesrespuesta} onChangeFn={chgPre} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <CampoFechaNullable label="Inicio PT"
                fieldKey="fechaprertemporalesinicio" value={pre.fechaprertemporalesinicio} onChangeFn={chgPre} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <CampoFechaNullable label="Fin PT"
                fieldKey="fechaprertemporalesfin" value={pre.fechaprertemporalesfin} onChangeFn={chgPre} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleInput label="Notif. coord. PT"
                value={pre.prertemporalesnoticord ?? ''}
                onChange={e => chgPre('prertemporalesnoticord', e.target.value)} />
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', margin: '16px 0 10px' }}>
            AMPLIACIÓN PRERROGATIVAS TEMPORALES
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleSelect label="Solicitud ampliación PT" value={pre.amplprertemporalessolicitud ?? ''}
                onChange={e => chgPre('amplprertemporalessolicitud', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleSelect label="Respuesta ampliación PT" value={pre.amplprertemporalesrespuesta ?? ''}
                onChange={e => chgPre('amplprertemporalesrespuesta', e.target.value)} options={OPTSINO} />
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', margin: '16px 0 10px' }}>
            AUTORIZACIONES Y CERTIFICADOS
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <SimpleSelect label="Auth. credenciales" value={pre.cartaauthcredenciales ?? ''}
                onChange={e => chgPre('cartaauthcredenciales', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 170px' }}>
              <CampoFechaNullable label="Fecha auth. credenciales"
                fieldKey="fechacartaauthcredenciales" value={pre.fechacartaauthcredenciales} onChangeFn={chgPre} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <SimpleSelect label="Auth. ingreso CME" value={pre.cartaauthingresocme ?? ''}
                onChange={e => chgPre('cartaauthingresocme', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 170px' }}>
              <CampoFechaNullable label="Fecha auth. ingreso CME"
                fieldKey="fechacartaauthingresocme" value={pre.fechacartaauthingresocme} onChangeFn={chgPre} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleSelect label="Notif. ingreso profesional" value={pre.notificacioningresoprofesional ?? ''}
                onChange={e => chgPre('notificacioningresoprofesional', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleSelect label="Cert. entrega modelo médico" value={pre.certentregamodelomedico ?? ''}
                onChange={e => chgPre('certentregamodelomedico', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleSelect label="Carta recept. doc. modelo médico" value={pre.cartareceptdocmodelomedico ?? ''}
                onChange={e => chgPre('cartareceptdocmodelomedico', e.target.value)} options={OPTSINO} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <SimpleSelect label="Decl. conflicto de intereses" value={pre.declaracionconflictointereses ?? ''}
                onChange={e => chgPre('declaracionconflictointereses', e.target.value)} options={OPTSINO} />
            </div>
          </div>
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