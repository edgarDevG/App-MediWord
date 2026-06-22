import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { getAvatarColor, getInitials } from '../../components/shared/DoctorAvatar';
import './FormMedico.css';

/* ══════════════════════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════════════════════ */
/* Espejo exacto del array CURSOS de Tab4institucional */
const CURSOS = [
  { key: 'bls',                    label: 'BLS',             icon: 'favorite',              campo: 'bls_fecha_venc'             },
  { key: 'acls',                   label: 'ACLS',            icon: 'monitor_heart',         campo: 'acls_fecha_venc'            },
  { key: 'pals',                   label: 'PALS',            icon: 'child_care',            campo: 'pals_fecha_venc'            },
  { key: 'nals',                   label: 'NALS',            icon: 'baby_changing_station', campo: 'nals_fecha_venc'            },
  { key: 'violenciasexual',        label: 'Viol. Sexual',    icon: 'shield_person',         campo: 'violencia_sexual_fecha'     },
  { key: 'ataquesagentesquimicos', label: 'Ag. Químicos',    icon: 'science',               campo: 'ataques_quimicos_fecha'     },
  { key: 'dengue',                 label: 'Dengue',          icon: 'bug_report',            campo: 'dengue_fecha'               },
  { key: 'sedacion',               label: 'Sedación',        icon: 'medication',            campo: 'sedacion_fecha'             },
  { key: 'cuidadodonanteins',      label: 'Gest. Donación',  icon: 'volunteer_activism',    campo: 'cuidado_donante_fecha'      },
  { key: 'radioproteccion',        label: 'Radioprotec.',    icon: 'radar',                 campo: 'radioproteccion_fecha'      },
  { key: 'manejodolor',            label: 'Man. Dolor',      icon: 'healing',               campo: 'manejo_dolor_fecha'         },
  { key: 'iamii',                  label: 'IAMII',           icon: 'cardiology',            campo: 'iamii_fecha'                },
  { key: 'gestionduelo',           label: 'Gest. Duelo',     icon: 'sentiment_sad',         campo: 'gestion_duelo_fecha'        },
  { key: 'curso3anos',             label: 'Póliza RC',       icon: 'policy',                campo: 'cursos_3_anios_fecha_venc'  },
];

const E = {
  vigente:      { label: 'Vigente',    color: '#0A7E6E', bg: 'rgba(10,126,110,0.10)', border: 'rgba(10,126,110,0.20)', icon: 'check_circle'   },
  por_vencer:   { label: 'Por vencer', color: '#b45309', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.20)',  icon: 'schedule'       },
  vencido:      { label: 'Vencido',    color: '#ba1a1a', bg: 'rgba(186,26,26,0.10)',  border: 'rgba(186,26,26,0.20)',  icon: 'cancel'         },
  sin_registro: { label: 'Sin datos',  color: '#94a3b8', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.2)', icon: 'remove_circle'  },
};

/* ── Helpers ── */
const toDate    = (v) => (!v ? '' : String(v).slice(0, 10));
const fmtDate   = (v) => {
  if (!v) return '—';
  const d = new Date(v.includes('T') ? v : v + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};
const calcEstado = (fecha) => {
  if (!fecha) return 'sin_registro';
  const diff = (new Date(fecha) - new Date()) / 86400000;
  if (diff < 0) return 'vencido';
  if (diff <= 60) return 'por_vencer';
  return 'vigente';
};

/* ══════════════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════════════ */

/* ── Tarjeta de cada curso en el dashboard ── */
function CursoCard({ curso }) {
  const cfg = E[curso.estado];
  return (
    <div style={{
      padding: '10px 11px',
      background: cfg.bg,
      borderRadius: 9,
      border: `1px solid ${cfg.border}`,
      display: 'flex', flexDirection: 'column', gap: 5,
      transition: 'transform 150ms, box-shadow 150ms, background 150ms',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,37,64,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Fila icono + nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: cfg.color, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>
          {curso.icon}
        </span>
        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {curso.label}
        </span>
      </div>
      {/* Badge estado */}
      <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: cfg.color, fontSize: '0.625rem', fontWeight: 700, border: `1px solid ${cfg.border}` }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
        {cfg.label}
      </span>
      {/* Fecha si aplica */}
      {curso.fechaVenc && (
        <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0, marginTop: 1 }}>
          Venc: {fmtDate(toDate(curso.fechaVenc))}
        </p>
      )}
    </div>
  );
}

/* ── Card contenedora con header ── */
function SCard({ title, icon, children, action, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 13, border: '1px solid rgba(10,37,64,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,37,64,0.08)', transition: 'box-shadow 200ms' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,37,64,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,37,64,0.08)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'linear-gradient(90deg, rgba(10,37,64,0.035) 0%, rgba(10,92,153,0.02) 100%)', borderBottom: '1px solid rgba(10,37,64,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {accent && <div style={{ width: 3.5, height: 16, borderRadius: 2, background: accent }} />}
          <span className="material-symbols-outlined" style={{ fontSize: 17, color: accent || '#0A7E6E', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0A2540', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  );
}

/* ── Fila de dato en sidebar ── */
function InfoRow({ icon, label, value, truncate }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0A5C99', flexShrink: 0, marginTop: 3, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '0.61rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: '0.8125rem', color: '#0A2540', fontWeight: 500, margin: 0, overflow: truncate ? 'hidden' : undefined, textOverflow: truncate ? 'ellipsis' : undefined, whiteSpace: truncate ? 'nowrap' : undefined, wordBreak: !truncate ? 'break-word' : undefined }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Mini stat pill ── */
function MiniStat({ value, label, color, bg }) {
  return (
    <div style={{ flex: 1, padding: '7px 6px', background: bg, borderRadius: 9, textAlign: 'center', transition: 'transform 150ms', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      <p style={{ fontSize: '1rem', fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.6rem', color, fontWeight: 600, margin: '3px 0 0', opacity: 0.9, lineHeight: 1 }}>{label}</p>
    </div>
  );
}

/* ── Tabla de info clave ── */
function InfoTable({ rows }) {
  const visible = rows.filter(r => r.value && r.value !== '—');
  if (!visible.length) return <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', padding: '1.25rem 0' }}>Sin datos registrados</p>;
  return (
    <div>
      {visible.map((r, i) => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < visible.length - 1 ? '1px solid rgba(10,37,64,0.06)' : 'none', gap: 12 }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{r.label}</span>
          {r.badge
            ? <BadgeVal value={r.value} />
            : <span style={{ fontSize: '0.875rem', color: '#0A2540', fontWeight: 600, textAlign: 'right' }}>{r.value}</span>
          }
        </div>
      ))}
    </div>
  );
}

function BadgeVal({ value }) {
  const v = String(value).toUpperCase();
  const ok  = ['SI', 'ACTIVO', 'VIGENTE'].includes(v);
  const na  = ['N/A', 'NA', ''].includes(v);
  const bg  = ok ? 'rgba(10,126,110,0.12)' : na ? 'rgba(148,163,184,0.12)' : 'rgba(10,92,153,0.1)';
  const col = ok ? '#0A7E6E'             : na ? '#64748b'                 : '#0A5C99';
  return <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: bg, color: col }}>{value}</span>;
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function PerfilMedico() {
  const { doc }  = useParams();
  const navigate = useNavigate();

  const [med,       setMed]       = useState(null);
  const [cont,      setCont]      = useState(null);
  const [hv,        setHv]        = useState(null);
  const [norm,      setNorm]      = useState(null);
  const [acc,       setAcc]       = useState(null);
  const [contrato,  setContrato]  = useState(null);
  const [docsHab,   setDocsHab]   = useState(null);  // docs-habilitacion (Tab3 DocPanel)
  const [ofertaDoc, setOfertaDoc] = useState(false); // si existe adjunto oferta mercantil
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!doc) return;
    (async () => {
      const [rMed, rCont, rHv, rNorm, rAcc, rContr, rDocs, rOferta] = await Promise.allSettled([
        axiosInstance.get(`/medicos/${doc}/`,                { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/contacto/`,       { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/documentos-hv/`,  { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/normativos/`,     { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/accesos/`,        { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/contratacion/`,   { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/docs-habilitacion/`, { skipToast: true }),
        axiosInstance.get(`/medicos/${doc}/archivos/`, { params: { campo_ref: 'oferta_mercantil' }, skipToast: true }),
      ]);
      if (rMed.status    === 'fulfilled') setMed(rMed.value.data);
      if (rCont.status   === 'fulfilled') setCont(rCont.value.data);
      if (rHv.status     === 'fulfilled') setHv(rHv.value.data);
      if (rNorm.status   === 'fulfilled') setNorm(rNorm.value.data);
      if (rAcc.status    === 'fulfilled') setAcc(rAcc.value.data);
      if (rContr.status  === 'fulfilled') setContrato(rContr.value.data);
      if (rDocs.status   === 'fulfilled') setDocsHab(rDocs.value.data);
      if (rOferta.status === 'fulfilled') {
        const lista = rOferta.value.data;
        setOfertaDoc(Array.isArray(lista) ? lista.length > 0 : !!lista);
      }
      setLoading(false);
    })();
  }, [doc]);

  /* ── Datos derivados ── */
  const _partes = med
    ? [med.primer_nombre, med.segundo_nombre, med.primer_apellido, med.segundo_apellido].filter(Boolean).join(' ')
    : '';
  const nombre = (med?.nombre_medico?.trim() || _partes || (med ? `Doc. ${med.documento_identidad}` : '—'));
  const activo    = med?.estado === 'ACTIVO';
  const avatarCl  = getAvatarColor(med?.categoria, nombre);
  const init      = getInitials(nombre);
  const editRoute = med?.tipo_listado === 'fsfb_externo'
    ? `/medicos-fsfb/${doc}/editar`
    : `/medicos/${doc}/editar`;

  const cursosConEstado = useMemo(() => CURSOS.map(c => {
    // Calcular el nombre de la columna de estado
    const campoEstado = c.campo.replace('_fecha_venc', '_estado').replace('_fecha', '_estado');
    const dbEstado = norm?.[campoEstado];
    
    let finalEstado = 'sin_registro';
    
    if (dbEstado) {
      const s = dbEstado.toLowerCase();
      if (s === 'vigente') finalEstado = 'vigente';
      else if (s === 'vencido') finalEstado = 'vencido';
      else if (s === 'por vencer' || s === 'por_vencer') finalEstado = 'por_vencer';
      else finalEstado = s;
    } else {
      finalEstado = calcEstado(norm?.[c.campo]);
    }

    return {
      ...c,
      fechaVenc: norm?.[c.campo] ?? null,
      estado:    E[finalEstado] ? finalEstado : 'sin_registro',
    };
  }), [norm]);

  const vigentes  = cursosConEstado.filter(c => c.estado === 'vigente').length;
  const vencidos  = cursosConEstado.filter(c => c.estado === 'vencido').length;
  const porVencer = cursosConEstado.filter(c => c.estado === 'por_vencer').length;
  const pct = Math.round((vigentes / CURSOS.length) * 100);
  const pctColor = pct >= 80 ? '#0A7E6E' : pct >= 50 ? '#b45309' : '#ba1a1a';

  /* RETHUS: estado real basado en fecha_vencimiento del DocPanel de Tab3 */
  const rethusDoc     = docsHab?.rethus;
  const rethusFecha   = rethusDoc?.fecha_vencimiento ?? null;
  const rethusEstado  = rethusDoc ? 'vigente' : 'sin_registro';
  const rethusCfg     = E[rethusEstado];

  /* VISA CE: visible solo cuando el tipo de documento es CE */
  const esCE       = hv?.tipo_documento === 'CE';
  const visaFecha  = toDate(hv?.fecha_vencimiento_visa) || null;
  const visaEstado = esCE ? (visaFecha ? calcEstado(visaFecha) : 'sin_registro') : null;
  const visaCfg    = visaEstado ? E[visaEstado] : null;

  /* OFERTA MERCANTIL: visible solo cuando el tipo de vinculación lo requiere */
  const TIPOS_OFERTA = ['OFERTA MERCANTIL', 'LABORAL/OFERTA MERCANTIL'];
  const tieneOferta  = TIPOS_OFERTA.includes(contrato?.tipo_vinculacion ?? '');
  const ofertaFecha  = toDate(contrato?.fecha_venc_oferta) || null;
  const ofertaEstado = tieneOferta ? (ofertaFecha ? calcEstado(ofertaFecha) : 'sin_registro') : null;
  const ofertaCfg    = ofertaEstado ? E[ofertaEstado] : null;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: 'transparent' }}>
      <div style={{ textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#0A7E6E', animation: 'spin 2s linear infinite', display: 'block', fontVariationSettings: "'FILL' 1" }}>progress_activity</span>
        <p style={{ color: '#64748b', marginTop: 18, fontWeight: 500, fontSize: '0.95rem' }}>Cargando perfil médico…</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '100%', background: '#EEF1F5', margin: '0 -32px' }}>

      {/* ════════════════════════════════════════════════════
          SIDEBAR IZQUIERDO
          ════════════════════════════════════════════════════ */}
      <aside className="perfil-aside" style={{
        width: 260, flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid rgba(10,37,64,0.08)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0,
        height: 'calc(100dvh - 70px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        padding: '1.25rem 1rem',
        gap: '0.75rem',
      }}>

        {/* ── Avatar + Identidad ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>

        {/* ── Avatar circular */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: avatarCl.bg,
              border: `2.5px solid ${avatarCl.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: avatarCl.color,
              letterSpacing: '-0.03em', lineHeight: 1,
              boxShadow: `0 4px 16px ${avatarCl.color}25`,
            }}>
              {init}
            </div>
            {/* Dot de estado */}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 14, height: 14, borderRadius: '50%',
              background: activo ? '#0A7E6E' : med?.estado === 'RENUNCIA' ? '#ba1a1a' : med?.estado === 'FINALIZADO' ? '#92400e' : '#94a3b8',
              border: '2.5px solid #fff',
              boxShadow: activo ? '0 0 0 2px rgba(10,126,110,0.35)' : '0 0 0 2px rgba(148,163,184,0.25)',
            }} />
          </div>

          {/* Nombre y rol */}
          <div>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0A2540', margin: '0 0 3px', lineHeight: 1.3 }}>
              {nombre || 'Sin nombre'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              {[med?.especialidad, med?.cargo].filter(Boolean).join(' · ') || 'Médico'}
            </p>
          </div>

          {/* Badges estado + categoría */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
            {(() => {
              const cfg = {
                ACTIVO:     { bg: 'rgba(10,126,110,0.12)',  color: '#0A7E6E', border: 'rgba(10,126,110,0.25)',  label: 'Activo'     },
                INACTIVO:   { bg: 'rgba(148,163,184,0.12)', color: '#64748b', border: 'rgba(148,163,184,0.3)',  label: 'Inactivo'   },
                RENUNCIA:   { bg: 'rgba(186,26,26,0.10)',   color: '#ba1a1a', border: 'rgba(186,26,26,0.22)',   label: 'Renuncia'   },
                FINALIZADO: { bg: 'rgba(120,53,15,0.10)',   color: '#92400e', border: 'rgba(120,53,15,0.22)',   label: 'Finalizado' },
              }[med?.estado] ?? { bg: 'rgba(148,163,184,0.12)', color: '#64748b', border: 'rgba(148,163,184,0.3)', label: med?.estado ?? '—' };
              return (
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: '0.6875rem', fontWeight: 700,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  {cfg.label}
                </span>
              );
            })()}
            {med?.categoria && (
              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.6875rem', fontWeight: 700, background: avatarCl.bg, color: avatarCl.color, border: `1px solid ${avatarCl.color}40` }}>
                Cat. {med.categoria}
              </span>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(10,37,64,0.1), transparent)', flexShrink: 0 }} />

        {/* ── Info del médico ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow icon="badge"           label="Documento"   value={doc} />
          <InfoRow icon="calendar_today"  label="Ingreso"     value={fmtDate(toDate(med?.fecha_ingreso))} />
          <InfoRow icon="handshake"       label="Vinculación" value={contrato?.tipo_vinculacion} />
          <InfoRow icon="mail"            label="Correo"      value={cont?.correo} truncate />
          <InfoRow icon="smartphone"      label="Celular"     value={cont?.celular} />
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(10,37,64,0.1), transparent)', flexShrink: 0 }} />

        {/* ── Cumplimiento normativo ── */}
        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 11px' }}>
            Cumplimiento Normativo
          </p>

          {/* Barra principal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0A2540' }}>Cursos vigentes</span>
            <span style={{ fontSize: '0.9125rem', fontWeight: 800, color: pctColor }}>{pct}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 12, background: 'rgba(10,37,64,0.08)', overflow: 'hidden', marginBottom: 8, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 12, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', gap: 5 }}>
            <MiniStat value={vigentes}  label="Vigentes"    color="#0A7E6E" bg="rgba(10,126,110,0.1)" />
            <MiniStat value={porVencer} label="Por vencer"  color="#b45309" bg="rgba(217,119,6,0.1)"  />
            <MiniStat value={vencidos}  label="Vencidos"    color="#ba1a1a" bg="rgba(186,26,26,0.1)"  />
          </div>
        </div>

        {/* ── Botón editar ── */}
        <button
          onClick={() => navigate(editRoute)}
          className="btn btn-signature"
          style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined sm">edit</span>
          Editar médico
        </button>
      </aside>

      {/* ════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
          ════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, padding: '1.5rem 1.75rem', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8 }}>
              <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#0A5C99', fontWeight: 600, transition: 'color 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0A7E6E'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#0A5C99'; }}>
                Médicos
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
              <span>Perfil Médico</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A2540', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {nombre}
            </h1>
            {(med?.cargo || med?.especialidad) && (
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0' }}>
                {[med?.cargo, med?.especialidad].filter(Boolean).join(' — ')}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/medicos/${doc}/expediente`)}
              className="btn btn-tonal"
            >
              <span className="material-symbols-outlined sm">folder_open</span>
              Expediente
            </button>
            <button
              onClick={() => navigate(editRoute)}
              className="btn btn-signature"
            >
              <span className="material-symbols-outlined sm">edit</span>
              Editar médico
            </button>
          </div>
        </div>

        {/* ════ DASHBOARD DE CUMPLIMIENTO ════ */}
        <SCard
          title="Dashboard de Cumplimiento"
          icon="workspace_premium"
          accent="#0A7E6E"
          action={
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          }
        >
          {/* Grid de cursos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 8, marginBottom: 12 }}>
            {cursosConEstado.map(c => <CursoCard key={c.key} curso={c} />)}

            {/* RETHUS — datos desde docs-habilitacion (Tab3 DocPanel) */}
            <div style={{ padding: '11px 12px', background: rethusCfg.bg, borderRadius: 10, border: `1px solid ${rethusCfg.border}`, display: 'flex', flexDirection: 'column', gap: 5, transition: 'transform 150ms, box-shadow 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,37,64,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: rethusCfg.color, fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a' }}>Tarjeta RETHUS</span>
              </div>
              <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: rethusCfg.color, fontSize: '0.625rem', fontWeight: 700, border: `1px solid ${rethusCfg.border}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>{rethusCfg.icon}</span>
                {rethusCfg.label}
              </span>
              {rethusDoc?.numero_documento_hv && (
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0 }}>
                  N°: {rethusDoc.numero_documento_hv}
                </p>
              )}
              {rethusFecha && (
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0 }}>
                  Venc: {fmtDate(toDate(rethusFecha))}
                </p>
              )}
            </div>

            {/* VISA CE — solo visible cuando el tipo de documento es Cédula de Extranjería */}
            {esCE && visaCfg && (
              <div style={{ padding: '11px 12px', background: visaCfg.bg, borderRadius: 10, border: `1px solid ${visaCfg.border}`, display: 'flex', flexDirection: 'column', gap: 5, transition: 'transform 150ms, box-shadow 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,37,64,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: visaCfg.color, fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a' }}>Visa CE</span>
                </div>
                <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: visaCfg.color, fontSize: '0.625rem', fontWeight: 700, border: `1px solid ${visaCfg.border}` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>{visaCfg.icon}</span>
                  {visaCfg.label}
                </span>
                {visaFecha
                  ? <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0 }}>Venc: {fmtDate(visaFecha)}</p>
                  : <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Sin fecha registrada</p>
                }
              </div>
            )}

            {/* OFERTA MERCANTIL — solo visible cuando el tipo de vinculación lo requiere */}
            {tieneOferta && ofertaCfg && (
              <div style={{ padding: '11px 12px', background: ofertaCfg.bg, borderRadius: 10, border: `1px solid ${ofertaCfg.border}`, display: 'flex', flexDirection: 'column', gap: 5, transition: 'transform 150ms, box-shadow 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,37,64,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: ofertaCfg.color, fontVariationSettings: "'FILL' 1" }}>description</span>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#0f172a' }}>Oferta Mercantil</span>
                </div>
                <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.8)', color: ofertaCfg.color, fontSize: '0.625rem', fontWeight: 700, border: `1px solid ${ofertaCfg.border}` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>{ofertaCfg.icon}</span>
                  {ofertaCfg.label}
                </span>
                {ofertaFecha && (
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0 }}>
                    Venc: {fmtDate(ofertaFecha)}
                  </p>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.625rem', fontWeight: 600, color: ofertaDoc ? '#0A7E6E' : '#94a3b8' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>{ofertaDoc ? 'attach_file' : 'file_present'}</span>
                  {ofertaDoc ? 'Doc. adjunto' : 'Sin documento'}
                </span>
              </div>
            )}
          </div>

          {/* Banner alerta */}
          {(vencidos > 0 || porVencer > 0) && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 15px',
              background: vencidos > 0 ? 'rgba(186,26,26,0.07)' : 'rgba(217,119,6,0.07)',
              border: `1px solid ${vencidos > 0 ? 'rgba(186,26,26,0.22)' : 'rgba(217,119,6,0.22)'}`,
              borderRadius: 11,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: vencidos > 0 ? '#ba1a1a' : '#b45309', fontVariationSettings: "'FILL' 1", flexShrink: 0, marginTop: 1 }}>warning</span>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: vencidos > 0 ? '#ba1a1a' : '#b45309', margin: '0 0 3px' }}>
                  {vencidos > 0
                    ? `${vencidos} certificación${vencidos > 1 ? 'es vencidas' : ' vencida'}`
                    : `${porVencer} certificación${porVencer > 1 ? 'es por vencer' : ' por vencer'}`}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  {vencidos > 0
                    ? 'Se recomienda gestionar la renovación de los cursos vencidos.'
                    : 'Cursos que vencen en los próximos 60 días. Planificar renovación.'}
                </p>
              </div>
            </div>
          )}

          {/* Todo al día */}
          {vencidos === 0 && porVencer === 0 && vigentes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', background: 'rgba(10,126,110,0.08)', border: '1px solid rgba(10,126,110,0.2)', borderRadius: 11 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#0A7E6E', fontVariationSettings: "'FILL' 1" }}>verified</span>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0A7E6E', margin: 0 }}>
                Todos los cursos registrados están vigentes.
              </p>
            </div>
          )}
        </SCard>

        {/* ════ FILA: CONTRATACIÓN + ACCESOS ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', '@media (maxWidth: 768px)': { gridTemplateColumns: '1fr' } }}>

          <SCard title="Contratación" icon="handshake" accent="#0A5C99">
            <InfoTable rows={[
              { label: 'Tipo vinculación',  value: contrato?.tipo_vinculacion },
              { label: 'Estado contrato',   value: contrato?.estado_contrato,  badge: true },
              { label: 'Tipo contrato',     value: contrato?.tipo_contrato },
              { label: 'Firma contrato',    value: fmtDate(toDate(contrato?.fecha_firma_contrato)) },
              { label: 'Honorarios',        value: contrato?.modalidad_honorarios },
              { label: 'Jornada (h)',       value: contrato?.jornada ? `${contrato.jornada} h` : null },
            ]} />
          </SCard>

          <SCard title="Accesos y Acreditaciones" icon="verified_user" accent="#0A5C99">
            <InfoTable rows={[
              { label: 'Estado código',     value: acc?.estado_codigo,         badge: true },
              { label: 'Estado carnet',     value: acc?.estado_carnet,         badge: true },
              { label: 'Ind. Médica FSFB',  value: acc?.induccion_medica_fsfb, badge: true },
              { label: 'Ind. Médica CHSM',  value: acc?.induccion_medica_chsm, badge: true },
              { label: 'Póliza resp. civil',value: acc?.poliza_resp_civil,     badge: true },
              { label: 'Venc. póliza',      value: fmtDate(toDate(acc?.fecha_venc_poliza)) },
            ]} />
          </SCard>
        </div>

        {/* ════ DATOS PERSONALES ════ */}
        {(hv || cont) && (
          <SCard title="Datos Personales" icon="person" accent="#0A5C99">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.1rem 1.75rem' }}>
              {[
                { label: 'Tipo documento',   value: hv?.tipo_documento ?? hv?.tipodocumento },
                { label: 'Lugar expedición', value: hv?.lugar_expedicion ?? hv?.lugarexpedicion },
                { label: 'Fecha nacimiento', value: fmtDate(toDate(hv?.fecha_nacimiento ?? hv?.fechanacimiento)) },
                { label: 'Lugar nacimiento', value: hv?.lugar_nacimiento ?? hv?.lugarnacimiento },
                { label: 'Género',           value: { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' }[hv?.sexo ?? hv?.genero] ?? (hv?.sexo ?? hv?.genero) },
                { label: 'Estado civil',     value: { 'S': 'Soltero/a', 'C': 'Casado/a', 'U': 'Unión libre', 'D': 'Divorciado/a', 'V': 'Viudo/a' }[cont?.estado_civil] ?? cont?.estado_civil },
                { label: 'Tiene hijos',      value: typeof cont?.tiene_hijos === 'boolean' ? (cont.tiene_hijos ? 'Sí' : 'No') : cont?.tiene_hijos },
                { label: 'Lengua de señas',  value: cont?.maneja_lengua_senas ? 'Sí' : null },
                { label: 'Correo alterno',   value: cont?.correo_alterno },
                { label: 'Contacto emerg.',  value: cont?.contacto_emergencia },
                { label: 'Parentesco',       value: cont?.parentesco },
                { label: 'Tel. emergencia',  value: cont?.tel_emergencia },
              ].filter(r => r.value).map(r => (
                <div key={r.label}>
                  <p style={{ fontSize: '0.61rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{r.label}</p>
                  <p style={{ fontSize: '0.875rem', color: '#0A2540', fontWeight: 500, margin: 0 }}>{r.value}</p>
                </div>
              ))}
            </div>
          </SCard>
        )}

      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .perfil-aside::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
