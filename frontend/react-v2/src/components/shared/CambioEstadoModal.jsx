import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   CambioEstadoModal — Modal unificado para los 3 flujos de
   cambio de estado: renuncia · inactivo · finalizado
   ══════════════════════════════════════════════════════════════ */

const CONFIG = {
  renuncia: {
    titulo:    'Marcar renuncia',
    icono:     'logout',
    colorBtn:  '#92400E',
    bgBtn:     '#FEF3C7',
    colorConf: '#7C2D12',
    bgConf:    '#DC2626',
    info:      'Esta acción registrará la renuncia del médico. Pasará al listado de Renuncias y quedará registrado en el historial.',
    labelBtn:  'Confirmar renuncia',
  },
  inactivo: {
    titulo:    'Trasladar a inactivo',
    icono:     'person_off',
    colorBtn:  '#374151',
    bgBtn:     '#F3F4F6',
    colorConf: '#1F2937',
    bgConf:    '#475569',
    info:      'El médico pasará al listado de Personal Inactivo y su estado cambiará a Inactivo. Esta acción quedará registrada en el historial.',
    labelBtn:  'Confirmar inactivación',
  },
  finalizado: {
    titulo:    'Marcar finalización de contrato',
    icono:     'event_busy',
    colorBtn:  '#991B1B',
    bgBtn:     '#FEE2E2',
    colorConf: '#7F1D1D',
    bgConf:    '#DC2626',
    info:      'El contrato del médico quedará registrado como finalizado. Esta acción es irreversible y quedará en el historial.',
    labelBtn:  'Confirmar finalización',
  },
};

const today = () => new Date().toISOString().slice(0, 10);

function InputField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid rgba(197,198,210,0.5)',
  fontSize: '0.875rem', color: '#111827', outline: 'none',
  background: '#f9fafb', boxSizing: 'border-box',
  transition: 'border-color 150ms, box-shadow 150ms',
};

export default function CambioEstadoModal({ accion, doc, nombre, onClose, onSuccess, showToast }) {
  const cfg = CONFIG[accion] ?? CONFIG.renuncia;
  const primerNombre = nombre?.replace(/^Dr[a]?\.?\s+/i, '').split(' ').slice(0, 2).join(' ') ?? 'el médico';

  const [fechaTerminacion,        setFechaTerminacion]        = useState('');
  const [fechaInactivacion,       setFechaInactivacion]       = useState(today());
  const [fechaFinalizacion,       setFechaFinalizacion]       = useState('');
  const [formularioAutorizacion,  setFormularioAutorizacion]  = useState(false);
  const [direccionCorre,          setDireccionCorre]          = useState('');
  const [direccionCons,           setDireccionCons]           = useState('');
  const [motivo,                  setMotivo]                  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const firstInputRef = useRef(null);
  useEffect(() => { setTimeout(() => firstInputRef.current?.focus(), 80); }, []);

  // Cierre con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [loading, onClose]);

  const canConfirm = () => {
    if (accion === 'renuncia')   return !!fechaTerminacion;
    if (accion === 'inactivo')   return !!fechaInactivacion;
    if (accion === 'finalizado') return !!fechaFinalizacion && formularioAutorizacion;
    return false;
  };

  const handleConfirm = async () => {
    setApiError('');
    setLoading(true);
    try {
      const body = { nuevoEstado: accion, motivo: motivo || undefined };
      if (accion === 'renuncia')   body.fechaTerminacion          = fechaTerminacion;
      if (accion === 'inactivo') {
        body.fechaInactivacion          = fechaInactivacion;
        if (direccionCorre) body.direccionCorrespondencia = direccionCorre;
        if (direccionCons)  body.direccionConsultorio     = direccionCons;
      }
      if (accion === 'finalizado') {
        body.fechaFinalizacionContrato  = fechaFinalizacion;
        body.formularioAutorizacionDatos = true;
      }

      await axiosInstance.patch(`/medicos/${doc}/estado`, body, { skipToast: true });

      const labelAccion =
        accion === 'renuncia'   ? `La renuncia de ${primerNombre} ha sido registrada correctamente.`   :
        accion === 'inactivo'   ? `${primerNombre} ha sido trasladado a Personal Inactivo.`            :
                                  `La finalización de contrato de ${primerNombre} fue registrada.`;

      showToast(labelAccion, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al procesar la solicitud. Intenta de nuevo.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay
    <div
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,16,62,0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeInOverlay 150ms ease',
      }}
    >
      {/* Dialog */}
      <div style={{
        background: 'white', borderRadius: 18,
        boxShadow: '0 24px 64px rgba(0,16,62,0.2)',
        width: '100%', maxWidth: 480,
        animation: 'slideUpModal 180ms cubic-bezier(0.34,1.2,0.64,1)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(197,198,210,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bgBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: cfg.colorBtn, fontVariationSettings: "'FILL' 1" }}>{cfg.icono}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{cfg.titulo}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Dr(a). {primerNombre}
            </p>
          </div>
          <button
            onClick={onClose} disabled={loading}
            style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Texto informativo */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(197,198,210,0.2)' }}>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55 }}>{cfg.info}</p>
          </div>

          {/* ── CAMPOS RENUNCIA ── */}
          {accion === 'renuncia' && (
            <InputField label="Fecha de terminación" required>
              <input
                ref={firstInputRef}
                type="date" value={fechaTerminacion} onChange={e => setFechaTerminacion(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; e.target.style.boxShadow = 'none'; }}
              />
            </InputField>
          )}

          {/* ── CAMPOS INACTIVO ── */}
          {accion === 'inactivo' && (
            <>
              <InputField label="Fecha de inactivación" required>
                <input
                  ref={firstInputRef}
                  type="date" value={fechaInactivacion} onChange={e => setFechaInactivacion(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; e.target.style.boxShadow = 'none'; }}
                />
              </InputField>
              <InputField label="Dirección de correspondencia">
                <input
                  type="text" value={direccionCorre} onChange={e => setDireccionCorre(e.target.value)}
                  placeholder="Opcional"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; e.target.style.boxShadow = 'none'; }}
                />
              </InputField>
              <InputField label="Dirección de consultorio">
                <input
                  type="text" value={direccionCons} onChange={e => setDireccionCons(e.target.value)}
                  placeholder="Opcional"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; e.target.style.boxShadow = 'none'; }}
                />
              </InputField>
            </>
          )}

          {/* ── CAMPOS FINALIZACIÓN ── */}
          {accion === 'finalizado' && (
            <>
              <InputField label="Fecha de finalización del contrato" required>
                <input
                  ref={firstInputRef}
                  type="date" value={fechaFinalizacion} onChange={e => setFechaFinalizacion(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; e.target.style.boxShadow = 'none'; }}
                />
              </InputField>
              <div
                onClick={() => setFormularioAutorizacion(v => !v)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                  borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${formularioAutorizacion ? 'rgba(22,101,52,0.35)' : 'rgba(197,198,210,0.4)'}`,
                  background: formularioAutorizacion ? 'rgba(22,101,52,0.05)' : '#f9fafb',
                  transition: 'all 150ms',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${formularioAutorizacion ? '#166534' : '#cbd5e1'}`,
                  background: formularioAutorizacion ? '#166534' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}>
                  {formularioAutorizacion && <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'white', fontVariationSettings: "'FILL' 1" }}>check</span>}
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                    Formulario de autorización de datos (Ley 1581)<span style={{ color: '#DC2626', marginLeft: 3 }}>*</span>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
                    Confirmo que el médico firmó el formulario de autorización para el tratamiento de datos personales.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── MOTIVO (común, opcional) ── */}
          <InputField label="Motivo (opcional)">
            <textarea
              value={motivo} onChange={e => setMotivo(e.target.value.slice(0, 300))}
              placeholder="Describe el motivo del cambio de estado..."
              rows={3}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#1a4ed7'; e.target.style.boxShadow = '0 0 0 3px rgba(26,78,215,0.09)'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; e.target.style.boxShadow = 'none'; }}
            />
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', textAlign: 'right' }}>{motivo.length}/300</span>
          </InputField>

          {/* Error del servidor */}
          {apiError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#DC2626', flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>error</span>
              <p style={{ fontSize: '0.8125rem', color: '#991B1B', lineHeight: 1.45 }}>{apiError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(197,198,210,0.15)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose} disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(197,198,210,0.4)', background: 'white', fontSize: '0.875rem', fontWeight: 600, color: '#374151', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm} disabled={!canConfirm() || loading}
            style={{
              padding: '9px 22px', borderRadius: 10, border: 'none',
              background: !canConfirm() || loading ? '#e2e8f0' : cfg.bgConf,
              color: !canConfirm() || loading ? '#94a3b8' : 'white',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: !canConfirm() || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 150ms',
            }}
          >
            {loading
              ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }}>progress_activity</span> Procesando...</>
              : cfg.labelBtn
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal  { from { opacity: 0; transform: scale(0.95) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes spin          { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
