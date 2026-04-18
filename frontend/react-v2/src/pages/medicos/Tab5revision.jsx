import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   Tab5Revision.jsx — Revisión y Confirmar
   Archivo: src/pages/medicos/Tab5Revision.jsx

   Muestra resumen de los 4 tabs, indicadores de completitud,
   ejecuta guardado final coordinado y redirige a /medicos.
   ══════════════════════════════════════════════════════════════ */

/* ── Indicador de estado por sección ───────────────────────── */
function IndicadorEstado({ estado }) {
  if (estado === 'completo')
    return (
      <span className="badge badge-vigente" style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span className="material-symbols-outlined sm filled">check_circle</span>Completo
      </span>
    );
  if (estado === 'incompleto')
    return (
      <span className="badge badge-por-vencer" style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span className="material-symbols-outlined sm">warning</span>Incompleto
      </span>
    );
  return (
    <span className="badge badge-neutral" style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span className="material-symbols-outlined sm">radio_button_unchecked</span>Sin datos
    </span>
  );
}

/* ── Fila de dato en el resumen ─────────────────────────────── */
function FilaDato({ label, valor }) {
  if (!valor) return null;
  return (
    <div style={{ display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid rgba(197,198,210,0.2)' }}>
      <span style={{ flex:'0 0 200px', fontSize:'0.8125rem', color:'#64748b', fontWeight:500 }}>{label}</span>
      <span style={{ flex:1, fontSize:'0.875rem', color:'var(--color-primary)', fontWeight:500, wordBreak:'break-word' }}>{valor}</span>
    </div>
  );
}

/* ── Panel de sección en el resumen ─────────────────────────── */
function PanelResumen({ titulo, icono, estado, completados, total, children, open, onToggle }) {
  const pct = total > 0 ? Math.round((completados / total) * 100) : 0;
  const colorPct = pct === 100 ? 'var(--color-secondary)' : pct >= 50 ? '#d97706' : 'var(--color-error)';

  return (
    <div style={{
      border:'1px solid rgba(197,198,210,0.4)',
      borderRadius:'var(--radius-xl)',
      overflow:'hidden',
      background: open ? 'white' : 'var(--color-surface-container-low)',
      boxShadow: open ? 'var(--shadow-sm)' : 'none',
      transition:'all 180ms ease',
    }}>
      {/* Header */}
      <div
        style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'var(--space-4) var(--space-5)', cursor:'pointer',
          background: open ? 'rgba(26,78,215,0.04)' : 'transparent',
          borderBottom: open ? '1px solid rgba(197,198,210,0.25)' : 'none',
        }}
        onClick={onToggle} role="button" aria-expanded={open}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:38, height:38, borderRadius:'var(--radius-lg)',
            background: open ? 'rgba(26,78,215,0.08)' : 'var(--color-surface-container)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <span className="material-symbols-outlined" style={{ color: open ? 'var(--color-secondary)' : '#94a3b8', fontSize:20 }}>{icono}</span>
          </div>
          <div>
            <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'var(--color-primary)' }}>{titulo}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
              <div style={{ width:80, height:4, borderRadius:'var(--radius-full)', background:'rgba(197,198,210,0.4)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background: colorPct, borderRadius:'var(--radius-full)', transition:'width 400ms ease' }} />
              </div>
              <span style={{ fontSize:'0.6875rem', fontWeight:700, color: colorPct }}>{pct}%</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <IndicadorEstado estado={estado} />
          <span className="material-symbols-outlined sm" style={{ color:'#94a3b8', transition:'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
            expand_more
          </span>
        </div>
      </div>

      {/* Contenido */}
      {open && (
        <div style={{ padding:'var(--space-5)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Calcular estado de sección ─────────────────────────────── */
function calcEstado(campos, requeridos) {
  const totalReq  = requeridos.length;
  const llenos    = requeridos.filter(k => campos[k] && String(campos[k]).trim() !== '').length;
  if (llenos === 0)        return { estado:'sin_datos', completados:0, total:totalReq };
  if (llenos < totalReq)   return { estado:'incompleto', completados:llenos, total:totalReq };
  return { estado:'completo', completados:llenos, total:totalReq };
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════ */
export default function Tab5Revision({ medicoDoc, tab1Data, onPrev, completedSteps, markCompleted }) {
  const navigate = useNavigate();
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [openPan,    setOpenPan]    = useState({ tab1:true, tab2:false, tab3:false, tab4:false });

  const togglePan = k => setOpenPan(p => ({ ...p, [k]: !p[k] }));

  /* ── Completitud global ── */
  const tabsCompletados = completedSteps.length;
  const pctGlobal       = Math.round((tabsCompletados / 4) * 100);

  /* ── Estado de Tab1 ── */
  const REQUERIDOS_T1 = ['tipo_documento','documento_identidad','primer_nombre','primer_apellido','correo_electronico','categoria'];
  const estadoT1 = tab1Data ? calcEstado(tab1Data, REQUERIDOS_T1) : { estado:'sin_datos', completados:0, total:6 };

  /* ── Confirmación final ── */
  const handleConfirmar = async () => {
    if (tabsCompletados < 4) {
      setSaveError('Completa los 4 módulos antes de confirmar.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      /* Aquí puedes agregar un endpoint de "finalización" si el backend lo requiere */
      /* await axiosInstance.post(`/medicos/${medicoDoc}/finalizar`) */
      markCompleted(5);
      setGuardadoOk(true);
      setTimeout(() => navigate('/medicos', { state: { toast: 'Médico guardado correctamente' } }), 1800);
    } catch (e) {
      const msg = e.response?.data?.detail ?? 'Error al confirmar.';
      setSaveError(Array.isArray(msg) ? msg.map(m => m.msg ?? JSON.stringify(m)).join(' · ') : msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Borrador (guarda aunque haya incompletos) ── */
  const handleBorrador = () => {
    navigate('/medicos', { state: { toast: 'Borrador guardado. Puedes continuar más tarde.' } });
  };

  /* ── Pantalla de éxito ── */
  if (guardadoOk) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'4rem 2rem', minHeight:'calc(100vh - 148px)' }}>
      <div style={{
        width:80, height:80, borderRadius:'var(--radius-full)',
        background:'rgba(26,78,215,0.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <span className="material-symbols-outlined filled" style={{ fontSize:44, color:'var(--color-secondary)' }}>task_alt</span>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--color-primary)' }}>¡Médico guardado correctamente!</p>
        <p style={{ fontSize:'0.875rem', color:'#64748b', marginTop:6 }}>Redirigiendo a la lista de médicos…</p>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 100px)' }}>
      <div style={{ flex:1, padding:'3rem 2.5rem', maxWidth:1620, margin:'0 auto', width:'100%' }}>

        {/* Título */}
        <div style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'var(--color-primary)', letterSpacing:'-0.01em' }}>
            Revisión y Confirmar
          </h2>
          <p style={{ fontSize:'0.875rem', color:'var(--color-on-surface-variant)', marginTop:4 }}>
            Verifica que toda la información sea correcta antes de confirmar el registro.
          </p>
        </div>

        {/* ── Tarjeta de completitud global ── */}
        <div style={{
          background: pctGlobal === 100
            ? 'linear-gradient(135deg, rgba(26,78,215,0.06) 0%, rgba(26,78,215,0.02) 100%)'
            : 'rgba(245,158,11,0.06)',
          border: `1px solid ${pctGlobal === 100 ? 'rgba(26,78,215,0.15)' : 'rgba(245,158,11,0.25)'}`,
          borderRadius:'var(--radius-xl)', padding:'var(--space-5)',
          marginBottom:'var(--space-6)',
          display:'flex', flexWrap:'wrap', gap:20, alignItems:'center',
        }}>
          {/* Círculo de progreso */}
          <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
            <svg width="72" height="72" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(197,198,210,0.4)" strokeWidth="6" />
              <circle cx="36" cy="36" r="30" fill="none"
                stroke={pctGlobal===100 ? 'var(--color-secondary)' : '#d97706'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*30}`}
                strokeDashoffset={`${2*Math.PI*30*(1-pctGlobal/100)}`}
                style={{ transition:'stroke-dashoffset 600ms ease' }}
              />
            </svg>
            <span style={{
              position:'absolute', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)',
              fontSize:'0.9375rem', fontWeight:800,
              color: pctGlobal===100 ? 'var(--color-secondary)' : '#d97706'
            }}>{pctGlobal}%</span>
          </div>

          <div style={{ flex:1, minWidth:180 }}>
            <p style={{ fontSize:'1rem', fontWeight:700, color:'var(--color-primary)' }}>
              {pctGlobal === 100 ? 'Formulario completo — listo para confirmar' : `${tabsCompletados} de 4 módulos completados`}
            </p>
            <p style={{ fontSize:'0.8125rem', color:'#64748b', marginTop:4 }}>
              {pctGlobal === 100
                ? 'Todos los módulos han sido guardados correctamente.'
                : 'Regresa a los tabs pendientes para completar la información.'}
            </p>
          </div>

          {/* Chips de tabs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {[
              { id:1, label:'Datos del Médico'          },
              { id:2, label:'HV y Prerrogativas'        },
              { id:3, label:'Académica y Habilitación'  },
              { id:4, label:'Contratación y Normativos' },
            ].map(t => {
              const ok = completedSteps.includes(t.id);
              return (
                <span key={t.id} style={{
                  display:'flex', alignItems:'center', gap:4,
                  padding:'4px 10px', borderRadius:'var(--radius-full)',
                  fontSize:'0.75rem', fontWeight:600,
                  background: ok ? 'rgba(26,78,215,0.1)' : 'rgba(197,198,210,0.25)',
                  color: ok ? 'var(--color-secondary)' : '#94a3b8',
                  border: `1px solid ${ok ? 'rgba(26,78,215,0.2)' : 'transparent'}`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize:14 }}>{ok ? 'check_circle' : 'radio_button_unchecked'}</span>
                  {t.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Error global */}
        {saveError && (
          <div style={{ background:'rgba(186,26,26,0.08)', border:'1px solid rgba(186,26,26,0.3)', borderRadius:'var(--radius-xl)', padding:'var(--space-4) var(--space-5)', marginBottom:'var(--space-5)', display:'flex', gap:12 }} role="alert">
            <span className="material-symbols-outlined" style={{ color:'var(--color-error)', flexShrink:0 }}>error</span>
            <p style={{ fontSize:'0.875rem', color:'var(--color-error)', fontWeight:500 }}>{saveError}</p>
          </div>
        )}

        {/* ── Paneles de resumen por tab ── */}
        <p className="form-section-title">Resumen por módulo</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)', marginBottom:'var(--space-8)' }}>

          {/* Tab 1 */}
          <PanelResumen
            titulo="Datos del Médico" icono="person"
            estado={estadoT1.estado}
            completados={estadoT1.completados} total={estadoT1.total}
            open={openPan.tab1} onToggle={() => togglePan('tab1')}
          >
            {tab1Data ? (
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <FilaDato label="Nombre completo"   valor={[tab1Data.primer_nombre, tab1Data.segundo_nombre, tab1Data.primer_apellido, tab1Data.segundo_apellido].filter(Boolean).join(' ')} />
                <FilaDato label="Tipo / N.° documento" valor={tab1Data.tipo_documento ? `${tab1Data.tipo_documento} ${tab1Data.documento_identidad}` : null} />
                <FilaDato label="Fecha de nacimiento"  valor={tab1Data.fecha_nacimiento} />
                <FilaDato label="Género"               valor={tab1Data.genero} />
                <FilaDato label="Estado civil"         valor={tab1Data.estado_civil} />
                <FilaDato label="Correo electrónico"   valor={tab1Data.correo_electronico} />
                <FilaDato label="Celular"              valor={tab1Data.celular} />
                <FilaDato label="Dirección"            valor={tab1Data.direccion_residencia} />
                <FilaDato label="Categoría"            valor={tab1Data.categoria} />
                <FilaDato label="Condición laboral"    valor={tab1Data.condicion_laboral} />
                <FilaDato label="Fecha de ingreso"     valor={tab1Data.fecha_ingreso} />
                <FilaDato label="Estado"               valor={tab1Data.activo ? 'Activo' : 'Inactivo'} />
              </div>
            ) : (
              <p style={{ fontSize:'0.875rem', color:'#94a3b8' }}>Sin datos cargados.</p>
            )}
          </PanelResumen>

          {/* Tab 2 */}
          <PanelResumen
            titulo="HV y Prerrogativas" icono="folder_open"
            estado={completedSteps.includes(2) ? 'completo' : 'sin_datos'}
            completados={completedSteps.includes(2) ? 1 : 0} total={1}
            open={openPan.tab2} onToggle={() => togglePan('tab2')}
          >
            {completedSteps.includes(2) ? (
              <p style={{ fontSize:'0.875rem', color:'var(--color-secondary)', display:'flex', alignItems:'center', gap:6 }}>
                <span className="material-symbols-outlined sm filled">check_circle</span>
                Documentos de habilitación y contacto de emergencia guardados.
              </p>
            ) : (
              <p style={{ fontSize:'0.875rem', color:'#94a3b8' }}>Módulo no completado aún.</p>
            )}
          </PanelResumen>

          {/* Tab 3 */}
          <PanelResumen
            titulo="Académica y Habilitación" icono="school"
            estado={completedSteps.includes(3) ? 'completo' : 'sin_datos'}
            completados={completedSteps.includes(3) ? 1 : 0} total={1}
            open={openPan.tab3} onToggle={() => togglePan('tab3')}
          >
            {completedSteps.includes(3) ? (
              <p style={{ fontSize:'0.875rem', color:'var(--color-secondary)', display:'flex', alignItems:'center', gap:6 }}>
                <span className="material-symbols-outlined sm filled">check_circle</span>
                Títulos, especialidades y verificaciones académicas guardados.
              </p>
            ) : (
              <p style={{ fontSize:'0.875rem', color:'#94a3b8' }}>Módulo no completado aún.</p>
            )}
          </PanelResumen>

          {/* Tab 4 */}
          <PanelResumen
            titulo="Contratación y Normativos" icono="local_hospital"
            estado={completedSteps.includes(4) ? 'completo' : 'sin_datos'}
            completados={completedSteps.includes(4) ? 1 : 0} total={1}
            open={openPan.tab4} onToggle={() => togglePan('tab4')}
          >
            {completedSteps.includes(4) ? (
              <p style={{ fontSize:'0.875rem', color:'var(--color-secondary)', display:'flex', alignItems:'center', gap:6 }}>
                <span className="material-symbols-outlined sm filled">check_circle</span>
                Normativos, contratación e ingreso al cuerpo médico guardados.
              </p>
            ) : (
              <p style={{ fontSize:'0.875rem', color:'#94a3b8' }}>Módulo no completado aún.</p>
            )}
          </PanelResumen>

        </div>
      </div>

      {/* ── Footer sticky ── */}
      <div className="form-footer">
        <button className="btn btn-tonal" onClick={onPrev} disabled={saving}>
          <span className="material-symbols-outlined sm">arrow_back</span>Contratación y Normativos
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:12,  minHeight:'inherit' }}>
          {/* Guardar como borrador */}
          <button
            className="btn btn-tonal"
            onClick={handleBorrador}
            disabled={saving}
            style={{ color:'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined sm">save</span>
            Guardar borrador
          </button>

          {/* Confirmar y guardar */}
          <button
            className="btn btn-signature"
            onClick={handleConfirmar}
            disabled={saving || pctGlobal < 100}
            title={pctGlobal < 100 ? 'Completa los 4 módulos para confirmar' : 'Confirmar registro'}
            style={{ opacity: pctGlobal < 100 ? 0.55 : 1 }}
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined sm" style={{ animation:'spin 1s linear infinite' }}>progress_activity</span>
                Confirmando…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined sm filled">task_alt</span>
                Confirmar y guardar
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
