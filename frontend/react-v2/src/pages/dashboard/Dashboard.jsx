/* ══════════════════════════════════════════════════════════════
   Dashboard.jsx v6 — MediWork HSM
   Diseño refinado — lógica de fetching intacta
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CAT_COLORS = {
  A:  { bg: '#dce1ff', color: '#003ab3' },
  AE: { bg: '#f3e8ff', color: '#6b21a8' },
  AP: { bg: '#ccfbf1', color: '#004f58' },
  C:  { bg: '#fef9c3', color: '#854d0e' },
  B:  { bg: '#fce7f3', color: '#9d174d' },
  E:  { bg: '#fce7f3', color: '#9d174d' },
};

const safe = (v) => (v === undefined || v === null || v === '') ? '—' : v;

const stripEsp = (v) => v ? v.replace(/^especialista en /i, '') : v;

const mapMedico = (m) => ({
  doc:   safe(m.documento_identidad),
  nom:   safe(m.nombre_medico),
  cat:   safe(m.categoria),
  esp:   safe(stripEsp(m.especialidad)),
  sec:   safe(m.seccion_nombre),
  dep:   safe(m.dept_coordinacion_nombre),
  cargo: safe(m.cargo ?? m.funcion),
  est:   m.estado ?? 'ACTIVO',
});

/* ── Componentes UI ───────────────────────────────────────────── */
function BadgeCat({ cat }) {
  const s = CAT_COLORS[cat] ?? { bg: '#e2e8f0', color: '#475569' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: 9999,
      fontSize: '0.6875rem', fontWeight: 700, whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      {cat !== '—' ? `Cat ${cat}` : '—'}
    </span>
  );
}

function BadgeEstado({ estado }) {
  const e = (estado ?? '').toString().toUpperCase();
  const cfg = e.includes('INACTIV') || e.includes('VENC') || e.includes('ALERTA')
    ? { icon: 'warning',      color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  label: 'Alerta doc.' }
    : e.includes('PROCESO')   || e.includes('TRAMITE')
    ? { icon: 'pending',      color: '#d97706', bg: 'rgba(245,158,11,0.08)', label: 'En proceso'  }
    : { icon: 'check_circle', color: '#065f46', bg: 'rgba(6,95,70,0.07)',    label: 'Activo'      };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.8125rem', fontWeight: 600, color: cfg.color,
      background: cfg.bg, padding: '3px 10px', borderRadius: 9999,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ label, valor, sub, accentColor, topColor, icon, children, alert }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(25,28,30,0.06), 0 0 0 1px rgba(197,198,210,0.18)',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 150ms, transform 150ms',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(25,28,30,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(25,28,30,0.06), 0 0 0 1px rgba(197,198,210,0.18)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* barra superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: topColor ?? accentColor,
        borderRadius: '14px 14px 0 0',
      }} />

      {/* icono */}
      {icon && (
        <div style={{
          position: 'absolute', right: 16, top: 18,
          width: 34, height: 34, borderRadius: 9,
          background: `${accentColor}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentColor,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
        </div>
      )}

      <p style={{
        fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1,
      }}>
        {label}
      </p>

      {children ?? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: '2rem', fontWeight: 800, lineHeight: 1,
              color: alert ? '#dc2626' : '#00103e',
            }}>
              {safe(valor)}
            </span>
          </div>
          {sub && (
            <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Alert Banner ─────────────────────────────────────────────── */
function AlertBanner({ count }) {
  if (!count || count === 0 || count === '—') return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff1f1 0%, #fff7f7 100%)',
      border: '1px solid #fecaca',
      borderLeft: '4px solid #ef4444',
      borderRadius: 12,
      padding: '13px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      marginBottom: 22,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: '#fee2e2', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#dc2626',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>warning</span>
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991b1b' }}>
          {count} {count === 1 ? 'médico' : 'médicos'} con documentos por vencer
        </p>
        <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
          Revisa el panel de alertas para ver el detalle de cada documento
        </span>
      </div>
      <button
        style={{
          marginLeft: 'auto', padding: '7px 14px',
          borderRadius: 8, border: 'none',
          background: '#fee2e2', color: '#dc2626',
          fontSize: '0.75rem', fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'background 120ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
        onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
      >
        Ver alertas →
      </button>
    </div>
  );
}

/* ── ActionMenu de Tabla ───────────────────────────────────── */
function ActionMenu({ doc, onReload, showToast }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleChangeStatus = async (nuevoEstado, tipoListado) => {
    setOpen(false);
    if (!window.confirm(`¿Estás seguro que deseas marcar a este médico como ${nuevoEstado}?`)) return;
    try {
      await axiosInstance.patch(`/medicos/${doc}/estado`, {
        estado: nuevoEstado,
        tipo_listado: tipoListado
      });
      showToast?.('Médico clasificado exitosamente', 'success');
      onReload?.();
    } catch (e) {
      showToast?.(e.response?.data?.detail ?? 'Error al actualizar el estado', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
      <button
        title="Editar"
        onClick={() => navigate(`/medicos/editar/${doc}`)}
        style={{
          width: 30, height: 30, borderRadius: 7, border: 'none',
          cursor: 'pointer', background: 'transparent', color: '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 120ms, background 120ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#1a4ed7'; e.currentTarget.style.background = '#eef2ff'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
      >
        <span className="material-symbols-outlined sm">edit</span>
      </button>

      {user?.rol === 'admin' ? (
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            title="Clasificar u Opciones"
            onClick={() => setOpen(o => !o)}
            style={{
              width: 30, height: 30, borderRadius: 7, border: 'none',
              cursor: 'pointer', background: open ? '#f2f4f6' : 'transparent', color: open ? '#00103e' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 120ms, background 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00103e'; e.currentTarget.style.background = '#f2f4f6'; }}
            onMouseLeave={e => {
              if(!open) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }
            }}
          >
            <span className="material-symbols-outlined sm">more_vert</span>
          </button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 34,
              background: 'white', borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(197,198,210,0.3)',
              width: 210, zIndex: 100,
              display: 'flex', flexDirection: 'column', padding: '6px 0',
              animation: 'fadeInMenu 150ms ease-out',
            }}>
              <style>{`
                @keyframes fadeInMenu { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .action-menu-btn {
                  textAlign: left; padding: 10px 16px; border: none; background: transparent; cursor: pointer;
                  fontSize: 0.8125rem; fontWeight: 600; color: #334155; display: flex; align-items: center; gap: 8px;
                }
                .action-menu-btn:hover { background: #f8f9fb; color: #00103e; }
                .action-menu-btn.danger:hover { background: #fef2f2; color: #dc2626; }
              `}</style>
              <button className="action-menu-btn" onClick={() => navigate(`/medicos/${doc}`)}>
                <span className="material-symbols-outlined sm">open_in_new</span> Ver perfil completo
              </button>
              <div style={{ height: 1, background: 'rgba(197,198,210,0.3)', margin: '4px 0' }} />
              <button className="action-menu-btn danger" onClick={() => handleChangeStatus('RENUNCIA', 'renuncia')}>
                <span className="material-symbols-outlined sm">assignment_return</span> Marcar Renuncia
              </button>
              <button className="action-menu-btn danger" onClick={() => handleChangeStatus('FINALIZADO', 'finalizacion')}>
                <span className="material-symbols-outlined sm">event_busy</span> Marcar Finalización
              </button>
              <button className="action-menu-btn" onClick={() => handleChangeStatus('INACTIVO', 'inactivo')}>
                <span className="material-symbols-outlined sm">person_off</span> Trasladar a Inactivo
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          title="Ver perfil"
          onClick={() => navigate(`/medicos/${doc}`)}
          style={{
            width: 30, height: 30, borderRadius: 7, border: 'none',
            cursor: 'pointer', background: 'transparent', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 120ms, background 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00103e'; e.currentTarget.style.background = '#f2f4f6'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span className="material-symbols-outlined sm">open_in_new</span>
        </button>
      )}
    </div>
  );
}

/* ── Dashboard principal ──────────────────────────────────────── */
export default function Dashboard({ showToast }) {
  const navigate = useNavigate();

  const [resumen,   setResumen]   = useState(null);
  const [medicos,   setMedicos]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loadKpi,   setLoadKpi]   = useState(true);
  const [loadTbl,   setLoadTbl]   = useState(true);

  const SIZE = 20;

  /* ── KPIs ─────────────────────────────────────────────────── */
  useEffect(() => {
    setLoadKpi(true);
    axiosInstance.get('/dashboard/resumen', { skipToast: true })
      .then(r => setResumen(r.data))
      .catch(() => {})
      .finally(() => setLoadKpi(false));
  }, []);

  /* ── Médicos ──────────────────────────────────────────────── */
  const fetchMedicos = useCallback(() => {
    setLoadTbl(true);
    const params = new URLSearchParams({ page, size: SIZE });
    if (search)    params.set('search',    search);
    if (catFiltro) params.set('categoria', catFiltro);

    axiosInstance.get(`/medicos/?${params}`, { skipToast: true })
      .then(r => {
        const items = Array.isArray(r.data) ? r.data : (r.data.items ?? r.data.data ?? []);
        const cnt   = Array.isArray(r.data) ? r.data.length : (r.data.total ?? r.data.count ?? items.length);
        setMedicos(items);
        setTotal(cnt);
      })
      .catch(() => showToast?.('Error cargando médicos', 'error'))
      .finally(() => setLoadTbl(false));
  }, [page, search, catFiltro]);

  useEffect(() => { fetchMedicos(); }, [fetchMedicos]);
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Extraer KPIs ─────────────────────────────────────────── */
  const tot     = resumen?.totales ?? {};
  const cats    = resumen?.por_categoria ?? [];
  const alertas = Number(tot.alertas ?? tot.alertas_vencimiento ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / SIZE));

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>

      {/* Page Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: 24,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#00103e', lineHeight: 1.2 }}>
            Cuerpo Médico
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 3 }}>
            Dirección Médica · Vista integrada · Hospital Serena del Mar
          </p>
        </div>
        <button
          className="btn-signature"
          onClick={() => navigate('/medicos/nuevo')}
        >
          <span className="material-symbols-outlined sm">person_add</span>
          Nuevo médico
        </button>
      </div>

      {/* Alert Banner — solo visible si hay alertas */}
      {!loadKpi && <AlertBanner count={alertas} />}

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 26,
      }}>
        {loadKpi
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />
            ))
          : (<>
              <KpiCard
                label="Total Médicos" valor={tot.total_medicos}
                accentColor="#00103e" topColor="#00103e"
                icon="groups" sub="Cuerpo médico"
              />
              <KpiCard
                label="Médicos Activos" valor={tot.activos}
                accentColor="#1a4ed7" topColor="#1a4ed7"
                icon="verified_user" sub="Planta activa"
              />
              <KpiCard
                label="En Proceso" valor={tot.en_proceso}
                accentColor="#d97706" topColor="#f59e0b"
                icon="pending"
              />
              <KpiCard
                label="Personal Inactivo" valor={tot.inactivos}
                accentColor="#94a3b8" topColor="#94a3b8"
                icon="person_off"
              />
              <KpiCard
                label="Alertas Venc." valor={alertas || '—'}
                accentColor="#dc2626" topColor="#ef4444"
                icon={alertas > 0 ? 'priority_high' : 'check_circle'}
                alert={alertas > 0}
              />
              {/* Por Categoría */}
              <KpiCard label="Por Categoría" accentColor="#0e7e6e" topColor="#0e7e6e" icon="category">
                {cats.length > 0
                  ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                      {cats.map((c, i) => {
                        const col = CAT_COLORS[c.categoria] ?? { bg: '#e2e8f0', color: '#475569' };
                        return (
                          <span key={i} style={{
                            fontSize: '0.625rem', fontWeight: 700,
                            background: col.bg, color: col.color,
                            padding: '3px 8px', borderRadius: 6,
                          }}>
                            {c.categoria} · {c.total}
                          </span>
                        );
                      })}
                    </div>
                  )
                  : <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>—</span>
                }
              </KpiCard>
            </>)
        }
      </div>

      {/* Tabla */}
      <div style={{
        background: 'white', borderRadius: 14,
        border: '1px solid rgba(197,198,210,0.28)',
        boxShadow: '0 1px 3px rgba(25,28,30,0.06)',
        overflow: 'hidden',
      }}>

        {/* Toolbar */}
        <div style={{
          padding: '16px 22px',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
          borderBottom: '1px solid rgba(197,198,210,0.22)',
        }}>
          <div>
            <h3 style={{ fontWeight: 700, color: '#00103e', fontSize: '0.9375rem' }}>
              Listado del cuerpo médico
            </h3>
            {total > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                {total} registros
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Buscador */}
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined sm" style={{
                position: 'absolute', left: 10, top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8',
                pointerEvents: 'none', fontSize: 16,
              }}>search</span>
              <input
                style={{
                  paddingLeft: 34, paddingRight: 14, paddingBlock: 8,
                  border: '1px solid rgba(197,198,210,0.45)', borderRadius: 9,
                  fontSize: '0.8125rem', width: 270, outline: 'none',
                  background: '#f8f9fb', color: '#191c1e',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#4facb8';
                  e.target.style.boxShadow   = '0 0 0 3px rgba(79,172,184,0.12)';
                  e.target.style.background  = '#fff';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(197,198,210,0.45)';
                  e.target.style.boxShadow   = 'none';
                  e.target.style.background  = '#f8f9fb';
                }}
                placeholder="Buscar nombre, documento, especialidad..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Filtro categoría */}
            <div style={{
              display: 'flex', background: '#f2f4f6',
              padding: 3, borderRadius: 9, gap: 2,
            }}>
              {['', ...cats.map(c => c.categoria)].map(c => (
                <button
                  key={c || 'todos'}
                  onClick={() => { setCatFiltro(c); setPage(1); }}
                  style={{
                    padding: '5px 13px', borderRadius: 6, border: 'none',
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                    background: catFiltro === c ? 'white' : 'transparent',
                    color: catFiltro === c ? '#1a4ed7' : '#475569',
                    boxShadow: catFiltro === c ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 120ms',
                  }}
                >
                  {c === '' ? 'Todos' : `Cat ${c}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla interna */}
        <div style={{ paddingBottom: '160px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: '#f8f9fb',
                borderBottom: '1px solid rgba(197,198,210,0.3)',
              }}>
                {['Documento','Nombre','Categoría','Especialidad','Departamento / Sección','Estado','Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: h === 'Acciones' ? 'right' : 'left',
                    fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadTbl
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(197,198,210,0.12)' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div className="skeleton" style={{
                            height: 13, borderRadius: 6,
                            width: j === 1 ? '70%' : j === 3 ? '55%' : '40%',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : medicos.length === 0
                ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                      <span className="material-symbols-outlined"
                        style={{ fontSize: 44, display: 'block', marginBottom: 10, opacity: 0.4 }}>
                        person_search
                      </span>
                      <p style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9375rem' }}>
                        No se encontraron médicos
                      </p>
                      {search && (
                        <p style={{ fontSize: '0.8125rem', marginTop: 4, color: '#94a3b8' }}>
                          Intenta con otro término de búsqueda
                        </p>
                      )}
                    </td>
                  </tr>
                )
                : medicos.map((m, i) => {
                    const { doc, nom, cat, esp, dep, sec, est } = mapMedico(m);
                    const depLabel = sec !== '—' ? sec : dep;
                    return (
                      <tr
                        key={doc + i}
                        style={{
                          borderBottom: '1px solid rgba(197,198,210,0.15)',
                          transition: 'background 100ms', cursor: 'default',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,172,184,0.035)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '11px 16px', fontSize: '0.75rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                          {doc}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '0.875rem', fontWeight: 600, color: '#00103e', whiteSpace: 'nowrap' }}>
                          {nom}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <BadgeCat cat={cat} />
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '0.875rem', color: '#334155' }}>
                          {esp}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '0.75rem', color: '#475569' }}>
                          {depLabel}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <BadgeEstado estado={est} />
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                          <ActionMenu doc={doc} onReload={fetchMedicos} showToast={showToast} />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loadTbl && total > SIZE && (
          <div style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(197,198,210,0.2)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: '0.75rem',
            color: '#64748b', flexWrap: 'wrap', gap: 8,
          }}>
            <span>
              {(page - 1) * SIZE + 1}–{Math.min(page * SIZE, total)} de {total} médicos
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: 30, height: 30, borderRadius: 7, border: 'none',
                  cursor: page === 1 ? 'default' : 'pointer',
                  background: 'none', color: '#475569',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: page === 1 ? 0.3 : 1,
                }}
              >
                <span className="material-symbols-outlined sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, border: 'none',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                    background: page === pg ? '#00103e' : 'transparent',
                    color: page === pg ? 'white' : '#475569',
                    transition: 'all 120ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {pg}
                </button>
              ))}
              {totalPages > 7 && (
                <span style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: 30, height: 30, borderRadius: 7, border: 'none',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  background: 'none', color: '#475569',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: page === totalPages ? 0.3 : 1,
                }}
              >
                <span className="material-symbols-outlined sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
