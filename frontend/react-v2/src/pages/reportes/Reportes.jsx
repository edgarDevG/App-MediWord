/* ══════════════════════════════════════════════════════════════
   Reportes.jsx v2 — MediWork HSM
   Reportes y Exportaciones — KPIs, gráfica de estados,
   tabla de alertas por vencer y descarga de archivos.
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

/* ── Paleta de estados para la gráfica ───────────────────────── */
const ESTADO_COLORS = {
  activos:     { color: '#0e9b8a', label: 'Activos' },
  finalizados: { color: '#6366f1', label: 'Finalizados' },
  renuncias:   { color: '#f59e0b', label: 'Renuncias' },
  inactivos:   { color: '#94a3b8', label: 'Inactivos' },
  en_proceso:  { color: '#3b82f6', label: 'En proceso' },
};

/* ── Helpers ─────────────────────────────────────────────────── */
const safe = (v) => (v === undefined || v === null || v === '') ? 0 : Number(v);

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ label, valor, icon, accentColor, alert }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(25,28,30,0.06), 0 0 0 1px rgba(197,198,210,0.18)',
      display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative', overflow: 'hidden',
      flex: '1 1 180px', minWidth: 0,
    }}>
      {/* barra superior de color */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentColor, borderRadius: '14px 14px 0 0',
      }} />

      {/* ícono flotante */}
      <div style={{
        position: 'absolute', right: 16, top: 18,
        width: 34, height: 34, borderRadius: 9,
        background: `${accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
      </div>

      <p style={{
        fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1,
      }}>
        {label}
      </p>

      <span style={{
        fontSize: '2rem', fontWeight: 800, lineHeight: 1,
        color: alert ? '#dc2626' : '#00103e',
      }}>
        {valor ?? '—'}
      </span>
    </div>
  );
}

/* ── Gráfica horizontal de barras (CSS puro) ─────────────────── */
function BarChart({ datos, total }) {
  if (!total || total === 0) return (
    <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
      Sin datos disponibles
    </p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(ESTADO_COLORS).map(([key, cfg]) => {
        const valor = safe(datos[key]);
        const pct   = total > 0 ? (valor / total) * 100 : 0;

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Etiqueta */}
            <span style={{
              width: 90, flexShrink: 0,
              fontSize: '0.8125rem', fontWeight: 600, color: '#475569',
              textAlign: 'right',
            }}>
              {cfg.label}
            </span>

            {/* Barra contenedora */}
            <div style={{
              flex: 1, height: 20, borderRadius: 6,
              background: '#f1f5f9', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(pct, pct > 0 ? 0.8 : 0)}%`,
                background: cfg.color,
                borderRadius: 6,
                transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>

            {/* Valor numérico */}
            <span style={{
              width: 36, flexShrink: 0,
              fontSize: '0.8125rem', fontWeight: 700,
              color: valor > 0 ? cfg.color : '#cbd5e1',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>
              {valor}
            </span>

            {/* Porcentaje */}
            <span style={{
              width: 44, flexShrink: 0,
              fontSize: '0.75rem', color: '#94a3b8',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {pct > 0 ? `${pct.toFixed(1)}%` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Badge de estado para alertas ────────────────────────────── */
function BadgeAlerta({ diasRestantes }) {
  const dias = Number(diasRestantes);
  const vencido = dias < 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 9999,
      fontSize: '0.6875rem', fontWeight: 700, whiteSpace: 'nowrap',
      background: vencido ? 'rgba(220,38,38,0.1)'  : 'rgba(245,158,11,0.12)',
      color:      vencido ? '#dc2626'               : '#92400e',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
        {vencido ? 'error' : 'schedule'}
      </span>
      {vencido ? 'Vencido' : 'Por vencer'}
    </span>
  );
}

/* ── Card de exportación ──────────────────────────────────────── */
function ExportCard({ icon, title, description, buttonLabel, buttonIcon, accentColor, loading, onClick }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid rgba(197,198,210,0.35)',
      borderRadius: 14,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(25,28,30,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16,
      flex: '1 1 240px', minWidth: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* franja lateral */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
        background: accentColor, borderRadius: '14px 0 0 14px',
      }} />

      {/* ícono */}
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: `${accentColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor, flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{
          fontSize: '0.9375rem', fontWeight: 700,
          color: '#00103e', marginBottom: 6,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: '0.8125rem', color: '#64748b',
          lineHeight: 1.55,
        }}>
          {description}
        </p>
      </div>

      <button
        onClick={onClick}
        disabled={loading}
        className="btn btn-signature"
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined sm rpt-spin">progress_activity</span>
            Generando…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined sm">{buttonIcon}</span>
            {buttonLabel}
          </>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Componente principal
   ══════════════════════════════════════════════════════════════ */
export default function Reportes() {
  /* ── Estado ─────────────────────────────────────────────── */
  const [totales,    setTotales]    = useState(null);
  const [alertas,    setAlertas]    = useState([]);
  const [loadKpi,    setLoadKpi]    = useState(true);
  const [loadAlert,  setLoadAlert]  = useState(true);
  const [errorKpi,   setErrorKpi]   = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);

  const [dlCompleto,  setDlCompleto]  = useState(false);
  const [dlAlerts,    setDlAlerts]    = useState(false);
  const [dlPdf,       setDlPdf]       = useState(false);

  /* ── Fetch KPIs ─────────────────────────────────────────── */
  useEffect(() => {
    setLoadKpi(true);
    setErrorKpi(null);
    axiosInstance
      .get('/dashboard/resumen', { skipToast: true })
      .then(r => setTotales(r.data?.totales ?? r.data ?? {}))
      .catch(() => setErrorKpi('No se pudieron cargar los indicadores.'))
      .finally(() => setLoadKpi(false));
  }, []);

  /* ── Fetch alertas de vencimiento ───────────────────────── */
  useEffect(() => {
    setLoadAlert(true);
    setErrorAlert(null);
    axiosInstance
      .get('/notificaciones/vencimientos?dias_limite=30', { skipToast: true })
      .then(r => {
        const data = Array.isArray(r.data)
          ? r.data
          : (r.data?.items ?? r.data?.data ?? []);
        setAlertas(data);
      })
      .catch(() => setErrorAlert('No se pudieron cargar las alertas de vencimiento.'))
      .finally(() => setLoadAlert(false));
  }, []);

  /* ── Función reutilizable de descarga ───────────────────── */
  const handleDownload = async (endpoint, filename, setLoading) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(endpoint, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert(`Error al descargar ${filename}. Intenta de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  /* ── Datos derivados ────────────────────────────────────── */
  const tot         = totales ?? {};
  const totalMedicos = safe(tot.total_medicos ?? tot.total);
  const activos      = safe(tot.activos);
  const alertasVenc  = safe(tot.alertas ?? tot.alertas_vencimiento);
  const finalizados  = safe(tot.finalizados);
  const inactivos    = safe(tot.inactivos);
  const renuncias    = safe(tot.renuncias);
  const enProceso    = safe(tot.en_proceso);

  const chartTotal = activos + finalizados + renuncias + inactivos + enProceso || totalMedicos;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      {/* ── Keyframes para spinner ── */}
      <style>{`
        @keyframes rpt-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .rpt-spin { animation: rpt-spin 1s linear infinite; }
      `}</style>

      <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%', maxWidth: 1200 }}>

        {/* ══ 1. HEADER ══════════════════════════════════════════ */}
        <div className="page-header">
          <div className="page-header-left">
            <h2>Reportes y Exportaciones</h2>
            <p>
              Indicadores de estado del cuerpo médico, alertas de documentos por vencer
              y herramientas de exportación de datos.
            </p>
          </div>
        </div>

        {/* ══ 2. KPI CARDS ══════════════════════════════════════ */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28,
        }}>
          {loadKpi
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14, flex: '1 1 180px' }} />
              ))
            : errorKpi
            ? (
              <div style={{
                flex: '1 1 100%', padding: '1rem 1.25rem',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 12, color: '#dc2626',
                fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span className="material-symbols-outlined sm">error</span>
                {errorKpi}
              </div>
            )
            : (<>
              <KpiCard
                label="Total Médicos"
                valor={totalMedicos}
                icon="groups"
                accentColor="#00103e"
              />
              <KpiCard
                label="Médicos Activos"
                valor={activos}
                icon="verified_user"
                accentColor="#1a4ed7"
              />
              <KpiCard
                label="Alertas Venc."
                valor={alertasVenc}
                icon={alertasVenc > 0 ? 'priority_high' : 'check_circle'}
                accentColor={alertasVenc > 0 ? '#dc2626' : '#059669'}
                alert={alertasVenc > 0}
              />
              <KpiCard
                label="Finalizados"
                valor={finalizados}
                icon="event_busy"
                accentColor="#6366f1"
              />
            </>)
          }
        </div>

        {/* ══ 3. GRÁFICA DISTRIBUCIÓN POR ESTADO ════════════════ */}
        <div style={{
          background: 'white',
          border: '1px solid rgba(197,198,210,0.35)',
          borderRadius: 14,
          padding: '22px 26px',
          boxShadow: '0 1px 3px rgba(25,28,30,0.06)',
          marginBottom: 28,
        }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e' }}>
              Distribución por Estado
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: 2 }}>
              Proporción de médicos según su estado actual en el sistema
            </p>
          </div>

          {loadKpi
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{
                  height: 20, borderRadius: 6, marginBottom: 12,
                  width: `${55 + i * 8}%`,
                }} />
              ))
            : (
              <BarChart
                datos={{ activos, finalizados, renuncias, inactivos, en_proceso: enProceso }}
                total={chartTotal}
              />
            )
          }
        </div>

        {/* ══ 4. TABLA ALERTAS DOCUMENTOS ═══════════════════════ */}
        <div style={{
          background: 'white',
          border: '1px solid rgba(197,198,210,0.35)',
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(25,28,30,0.06)',
          marginBottom: 28,
          overflow: 'hidden',
        }}>
          {/* header de la sección */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(197,198,210,0.22)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(245,158,11,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#d97706', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notification_important</span>
            </div>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', lineHeight: 1.2 }}>
                Alertas de Documentos por Vencer
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 1 }}>
                Documentos con vencimiento en los próximos 30 días
              </p>
            </div>
            {!loadAlert && !errorAlert && alertas.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(220,38,38,0.1)', color: '#dc2626',
                padding: '4px 12px', borderRadius: 9999,
                fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* cuerpo con scroll */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loadAlert ? (
              <div style={{ padding: '16px 24px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    {[40, 30, 18, 14, 16].map((w, j) => (
                      <div key={j} className="skeleton" style={{
                        height: 13, borderRadius: 6, flex: `0 0 ${w}%`,
                      }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : errorAlert ? (
              <div style={{
                padding: '2rem', textAlign: 'center',
                color: '#dc2626', fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <span className="material-symbols-outlined sm">error</span>
                {errorAlert}
              </div>
            ) : alertas.length === 0 ? (
              <div style={{
                padding: '3rem', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 44, color: '#059669', opacity: 0.7,
                }}>
                  check_circle
                </span>
                <p style={{ fontWeight: 700, color: '#334155', fontSize: '0.9375rem' }}>
                  Sin alertas pendientes
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                  Todos los documentos están al día o sin vencimiento próximo
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: '#f8f9fb',
                    borderBottom: '1px solid rgba(197,198,210,0.25)',
                    position: 'sticky', top: 0, zIndex: 1,
                  }}>
                    {['Médico', 'Tipo Documento', 'Fecha Vencimiento', 'Días Restantes', 'Estado'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertas.slice(0, 10).map((a, i) => {
                    const dias = Number(a.dias_restantes ?? a.dias ?? 0);
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid rgba(197,198,210,0.15)',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600, color: '#00103e' }}>
                          {a.nombre_medico ?? a.medico ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#475569' }}>
                          {a.tipo_documento ?? a.documento ?? '—'}
                        </td>
                        <td style={{
                          padding: '12px 16px', fontSize: '0.875rem',
                          color: '#475569', fontVariantNumeric: 'tabular-nums',
                        }}>
                          {formatDate(a.fecha_vencimiento ?? a.fecha)}
                        </td>
                        <td style={{
                          padding: '12px 16px', fontSize: '0.875rem', fontWeight: 700,
                          color: dias < 0 ? '#dc2626' : dias <= 7 ? '#d97706' : '#475569',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {dias < 0 ? `${Math.abs(dias)} días vencido` : `${dias} días`}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <BadgeAlerta diasRestantes={dias} />
                        </td>
                      </tr>
                    );
                  })}
                  {alertas.length > 10 && (
                    <tr>
                      <td colSpan={5} style={{
                        padding: '10px 16px', textAlign: 'center',
                        fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic',
                      }}>
                        Mostrando 10 de {alertas.length} alertas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ══ 5. EXPORTACIONES ══════════════════════════════════ */}
        <div style={{ marginBottom: 8 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#00103e', marginBottom: 4 }}>
            Exportar Datos
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Descarga archivos con la información del cuerpo médico en diferentes formatos
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <ExportCard
            icon="table_view"
            title="Exportación Completa"
            description="Genera un archivo Excel (.xlsx) con todos los médicos, incluyendo datos generales, estado e información de contacto."
            buttonLabel="Descargar Excel"
            buttonIcon="download"
            accentColor="#0e9b8a"
            loading={dlCompleto}
            onClick={() => handleDownload('/reportes/exportar', 'reporte_medicos.xlsx', setDlCompleto)}
          />

          <ExportCard
            icon="notification_important"
            title="Alertas de Vencimiento"
            description="Exporta la lista de documentos próximos a vencer o ya vencidos para gestión inmediata."
            buttonLabel="Descargar Excel"
            buttonIcon="download"
            accentColor="#f59e0b"
            loading={dlAlerts}
            onClick={() => handleDownload('/reportes/exportar-alertas', 'alertas_vencimiento.xlsx', setDlAlerts)}
          />

          <ExportCard
            icon="picture_as_pdf"
            title="Reporte Ejecutivo PDF"
            description="Genera un reporte ejecutivo en formato PDF con indicadores clave, resumen estadístico y alertas prioritarias."
            buttonLabel="Descargar PDF"
            buttonIcon="picture_as_pdf"
            accentColor="#6366f1"
            loading={dlPdf}
            onClick={() => handleDownload('/reportes/exportar-pdf', 'reporte_ejecutivo.pdf', setDlPdf)}
          />
        </div>

      </div>
    </>
  );
}
