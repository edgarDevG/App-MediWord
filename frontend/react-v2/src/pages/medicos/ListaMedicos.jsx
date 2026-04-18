import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   ListaMedicos.jsx
   Cuerpo Médico — Hospital Serena del Mar
   Stack: React 19 · CSS Design System MediWork (index.css)
   Equipo: Sarah Chen · Marcus Rivera · Dr. Valeria Ospina
   ══════════════════════════════════════════════════════════════ */

/* ── Datos de demostración (se reemplazan con API real) ─────── */
const MOCK_MEDICOS = [
  { documento_identidad: 'CC 1.045.234.112', nombre_completo: 'Dr. Alberto Martínez Soler',    categoria: 'A',  especialidad: 'Cardiología Intervencionista', departamento: 'Medicina Interna',    estado: 'activo' },
  { documento_identidad: 'CC 72.884.102',    nombre_completo: 'Dra. Elena García Pantoja',     categoria: 'AE', especialidad: 'Neurología Pediátrica',        departamento: 'Pediatría',           estado: 'activo' },
  { documento_identidad: 'CC 45.663.120',    nombre_completo: 'Dr. Mauricio Casalins',         categoria: 'AP', especialidad: 'Ortopedia y Traumatología',    departamento: 'Cirugía',             estado: 'activo' },
  { documento_identidad: 'CC 1.114.506.772', nombre_completo: 'Dra. Claudia de la Rosa',       categoria: 'A',  especialidad: 'Anestesiología',               departamento: 'Serv. Quirúrgicos',   estado: 'alerta' },
  { documento_identidad: 'CC 80.234.556',    nombre_completo: 'Dr. Jorge Peña Villamil',       categoria: 'AE', especialidad: 'Oncología Médica',             departamento: 'Oncología',           estado: 'activo' },
  { documento_identidad: 'CC 1.020.789.234', nombre_completo: 'Dra. Sandra Montoya Ríos',      categoria: 'A',  especialidad: 'Ginecología y Obstetricia',    departamento: 'Ginecología',         estado: 'alerta' },
  { documento_identidad: 'CC 15.897.340',    nombre_completo: 'Dr. Camilo Estrada López',      categoria: 'AP', especialidad: 'Medicina de Urgencias',        departamento: 'Urgencias',          estado: 'activo' },
  { documento_identidad: 'CC 43.789.102',    nombre_completo: 'Dra. Patricia Lozano Ruiz',     categoria: 'A',  especialidad: 'Radiología e Imágenes Dx',    departamento: 'Diagnóstico',         estado: 'activo' },
];

const MOCK_KPIS = {
  activos: 142, fsfb: 86, alertas: 12, inactivos: 24, renuncias: 3,
  cat_a: 42, cat_ae: 28, cat_ap: 15,
};

const MOCK_ALERTAS = [
  { tipo: 'error',   doc: 'Rethus',                    medico: 'Dr. Martínez Soler',  id: '1.045.234.112', fecha: '12 Oct 2025', dias: 'Vencido · hace 5 días' },
  { tipo: 'warning', doc: 'Póliza Responsabilidad',    medico: 'Dra. García Pantoja', id: '72.884.102',    fecha: '25 Oct 2025', dias: '8 días restantes' },
  { tipo: 'warning', doc: 'Certificado Especialidad',  medico: 'Dr. Casalins',        id: '45.663.120',    fecha: '30 Oct 2025', dias: '13 días restantes' },
  { tipo: 'error',   doc: 'Examen Médico Ocupacional', medico: 'Dra. de la Rosa',     id: '1.114.506.772', fecha: '15 Oct 2025', dias: 'Vencido · hace 2 días' },
  { tipo: 'warning', doc: 'Tarjeta Profesional',       medico: 'Dr. Peña Villamil',   id: '80.234.556',    fecha: '02 Nov 2025', dias: '18 días restantes' },
];

/* ── Helpers ──────────────────────────────────────────────── */
function CategoriaBadge({ cat }) {
  const map = { A: 'badge badge-cat-a', AE: 'badge badge-cat-ae', AP: 'badge badge-cat-ap' };
  return <span className={map[cat] ?? 'badge badge-neutral'}>Cat {cat}</span>;
}

function EstadoBadge({ estado }) {
  if (estado === 'alerta') return (
    <span className="badge badge-por-vencer" style={{ display:'inline-flex', gap:4, alignItems:'center' }}>
      <span className="material-symbols-outlined sm">warning</span> Alerta doc.
    </span>
  );
  return (
    <span className="badge badge-vigente" style={{ display:'inline-flex', gap:4, alertas:'center' }}>
      <span className="material-symbols-outlined sm">check_circle</span> Activo
    </span>
  );
}

/* ── Componente KPI Card ─────────────────────────────────── */
function KpiCard({ label, value, variant = 'kpi-primary', meta, icon }) {
  return (
    <div className={`kpi-card ${variant}`}>
      <p className="kpi-label">{label}</p>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span className="kpi-value">{value}</span>
        {icon && <span className={`material-symbols-outlined ${variant === 'kpi-error' ? '' : ''}`}
          style={{ color: variant === 'kpi-error' ? 'var(--color-error)' : 'var(--color-on-surface-variant)', fontSize:18 }}>
          {icon}
        </span>}
      </div>
      {meta && <p className="kpi-meta">{meta}</p>}
    </div>
  );
}

/* ── Componente Alert Drawer ─────────────────────────────── */
function AlertDrawer({ open, onClose, alertas }) {
  const errores  = alertas.filter(a => a.tipo === 'error').length;
  const warnings = alertas.filter(a => a.tipo === 'warning').length;
  return (
    <aside className={`alert-drawer${open ? '' : ' hidden'}`} aria-label="Panel de alertas de vencimiento">
      {/* Header */}
      <div className="alert-drawer-header">
        <div>
          <h3 className="alert-drawer-title">Alertas de Vencimiento</h3>
          <p style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2, fontWeight:500 }}>
            {errores} vencidos · {warnings} por vencer
          </p>
        </div>
        <button className="topbar-icon-btn" onClick={onClose} aria-label="Cerrar panel">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="alert-drawer-body">
        {alertas.map((a, i) => (
          <div key={i} className={`alert-item${a.tipo === 'warning' ? ' warning' : ''}`}>
            <div className="alert-item-top">
              <div>
                <p className="alert-item-name">{a.doc}</p>
                <p className="alert-item-id">{a.medico} · {a.id}</p>
              </div>
              <span className={`badge ${a.tipo === 'error' ? 'badge-vencido' : 'badge-por-vencer'}`}>
                {a.tipo === 'error' ? 'Vencido' : 'Por vencer'}
              </span>
            </div>
            <div className="alert-item-footer">
              <span className="alert-item-date">Fecha: {a.fecha}</span>
              <span className="alert-item-days">{a.dias}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer acción */}
      <div className="alert-drawer-footer">
        <button className="btn btn-filled" style={{ width:'100%', justifyContent:'center' }}>
          <span className="material-symbols-outlined sm">send</span>
          Notificar a todos
        </button>
      </div>
    </aside>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════ */
export default function ListaMedicos() {
  const navigate = useNavigate();

  /* ── State ── */
  const [medicos,       setMedicos]       = useState([]);
  const [kpis,          setKpis]          = useState(MOCK_KPIS);
  const [alertas,       setAlertas]       = useState(MOCK_ALERTAS);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filtroCateg,   setFiltroCateg]   = useState('Todos');
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [page,          setPage]          = useState(1);
  const PAGE_SIZE = 25;

  /* ── Carga inicial ── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resMedicos, resKpis] = await Promise.all([
          axiosInstance.get('/medicos/?limit=100'),
          axiosInstance.get('/dashboard/resumen').catch(() => ({ data: MOCK_KPIS })),
        ]);
        setMedicos(resMedicos.data?.length ? resMedicos.data : MOCK_MEDICOS);
        setKpis(resKpis.data ?? MOCK_KPIS);
      } catch {
        setMedicos(MOCK_MEDICOS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── Filtrado ── */
  const filtrados = medicos.filter(m => {
    const matchSearch = search === '' ||
      m.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
      m.documento_identidad?.toLowerCase().includes(search.toLowerCase()) ||
      m.especialidad?.toLowerCase().includes(search.toLowerCase());
    const matchCateg = filtroCateg === 'Todos' || m.categoria === filtroCateg;
    return matchSearch && matchCateg;
  });

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados  = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback((e) => { setSearch(e.target.value); setPage(1); }, []);

  /* ── Render skeleton rows ── */
  const SkeletonRows = () => Array.from({ length: 6 }).map((_, i) => (
    <tr key={i}>
      {['140px','200px','80px','180px','140px','80px'].map((w, j) => (
        <td key={j} style={{ padding:'1rem 1.5rem' }}>
          <div className="skeleton skeleton-text" style={{ width: w }} />
        </td>
      ))}
    </tr>
  ));

  /* ── Render ── */
  return (
    <>
      {/* ── Alert Drawer ── */}
      <AlertDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} alertas={alertas} />

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Cuerpo Médico</h2>
          <p>Dirección Médica · Vista integrada · Hospital Serena del Mar</p>
        </div>
        <button
          className="btn btn-filled"
          onClick={() => navigate('/medicos/nuevo')}
          aria-label="Registrar nuevo médico"
        >
          <span className="material-symbols-outlined sm">person_add</span>
          Nuevo médico
        </button>
      </div>

      {/* ── Alerta Strip ── */}
      {kpis.alertas > 0 && (
        <div className="alerta-strip">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span className="material-symbols-outlined alerta-strip-icon xl">warning</span>
            <div className="alerta-strip-body">
              <p>Alertas Críticas de Documentación</p>
              <p>
                Hay <strong>{kpis.alertas}</strong> especialistas con documentos que vencen en los
                próximos 15 días.
              </p>
            </div>
          </div>
          <button
            className="btn btn-tonal btn-sm"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined sm">open_in_new</span>
            Ver detalles
          </button>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="kpi-grid">
        <KpiCard label="Médicos activos"      value={kpis.activos}    variant="kpi-primary" meta="+2% este mes" />
        <KpiCard label="Médicos FSFB"         value={kpis.fsfb}       variant="kpi-teal"    meta="Planta Fundación" />
        <KpiCard label="Alertas vencimiento"  value={kpis.alertas}    variant="kpi-error"   icon="priority_high" />
        <KpiCard label="Personal inactivo"    value={kpis.inactivos}  variant="kpi-neutral" />
        <KpiCard label="Renuncias mes"        value={`0${kpis.renuncias}`} variant="kpi-warning" />
        <div className="kpi-card kpi-dark">
          <p className="kpi-label">Por categoría</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
            <span className="badge badge-cat-a">A: {kpis.cat_a}</span>
            <span className="badge badge-cat-ae">AE: {kpis.cat_ae}</span>
            <span className="badge badge-cat-ap">AP: {kpis.cat_ap}</span>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <section className="table-container">

        {/* Toolbar */}
        <div className="table-toolbar">
          <h3 className="card-title">Listado del cuerpo médico</h3>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>

            {/* Buscador */}
            <div className="search-wrapper">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar médico o especialidad..."
                value={search}
                onChange={handleSearch}
                aria-label="Buscar médico"
              />
            </div>

            {/* Filtro categoría */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Todos','A','AE','AP'].map(cat => (
                <button
                  key={cat}
                  className={`chip${filtroCateg === cat ? ' active' : ''}`}
                  onClick={() => { setFiltroCateg(cat); setPage(1); }}
                  aria-pressed={filtroCateg === cat}
                >
                  {cat === 'Todos' ? 'Todos' : `Cat ${cat}`}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Tabla responsive */}
        <div style={{ overflowX:'auto' }}>
          <table className="mw-table" aria-label="Listado cuerpo médico">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Especialidad</th>
                <th>Departamento</th>
                <th>Estado</th>
                <th style={{ textAlign:'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : paginados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      padding:'3rem 1rem', gap:12, color:'var(--color-on-surface-variant)'
                    }}>
                      <span className="material-symbols-outlined xl" style={{ fontSize:48, color:'var(--color-outline-variant)' }}>
                        manage_search
                      </span>
                      <p style={{ fontWeight:600, color:'var(--color-on-surface)' }}>
                        No se encontraron médicos
                      </p>
                      <p style={{ fontSize:'0.8125rem' }}>
                        Intenta con otro término de búsqueda o cambia el filtro de categoría.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginados.map((m, i) => (
                  <tr key={m.documento_identidad ?? i}>
                    <td className="td-muted" style={{ fontVariantNumeric:'tabular-nums', fontSize:'0.75rem' }}>
                      {m.documento_identidad}
                    </td>
                    <td style={{ fontWeight:600 }}>{m.nombre_completo}</td>
                    <td><CategoriaBadge cat={m.categoria} /></td>
                    <td>{m.especialidad ?? '—'}</td>
                    <td className="td-muted">{m.departamento ?? '—'}</td>
                    <td><EstadoBadge estado={m.estado ?? 'activo'} /></td>
                    <td>
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:4 }}>
                        <button
                          className="topbar-icon-btn"
                          onClick={() => navigate(`/medicos/${m.documento_identidad}/editar`)}
                          aria-label={`Editar ${m.nombre_completo}`}
                          title="Editar"
                        >
                          <span className="material-symbols-outlined sm">edit</span>
                        </button>
                        <button
                          className="topbar-icon-btn"
                          aria-label={`Más opciones para ${m.nombre_completo}`}
                          title="Más opciones"
                        >
                          <span className="material-symbols-outlined sm">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer paginación */}
        <div className="table-footer">
          <span>
            {loading
              ? 'Cargando…'
              : `Mostrando ${Math.min((page-1)*PAGE_SIZE+1, filtrados.length)}–${Math.min(page*PAGE_SIZE, filtrados.length)} de ${filtrados.length} médicos`
            }
          </span>
          <div className="pagination" aria-label="Paginación">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              aria-label="Página anterior"
            >
              <span className="material-symbols-outlined sm">chevron_left</span>
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const n = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page+i-2;
              if (n < 1 || n > totalPages) return null;
              return (
                <button
                  key={n}
                  className={`page-btn${page === n ? ' active' : ''}`}
                  onClick={() => setPage(n)}
                  aria-label={`Página ${n}`}
                  aria-current={page === n ? 'page' : undefined}
                >
                  {n}
                </button>
              );
            })}

            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              aria-label="Página siguiente"
            >
              <span className="material-symbols-outlined sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
