/* ══════════════════════════════════════════════════════════════
   ListaFSFB.jsx — MediWork HSM v2
   Médicos FSFB (externos) — filtro: tipo_listado=fsfb_externo
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const safe = (v) => (v === undefined || v === null || v === '') ? '—' : v;

const CAT_COLORS = {
  A:  { bg: '#dce1ff', color: '#003ab3' },
  AE: { bg: '#f3e8ff', color: '#6b21a8' },
  AP: { bg: '#ccfbf1', color: '#004f58' },
  C:  { bg: '#fef9c3', color: '#854d0e' },
  E:  { bg: '#fce7f3', color: '#9d174d' },
  H:  { bg: '#e0f2fe', color: '#075985' },
  I:  { bg: '#fef3c7', color: '#92400e' },
};

export default function ListaFSFB({ showToast }) {
  const navigate = useNavigate();
  const [medicos, setMedicos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const SIZE = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page, size: SIZE,
      tipo_listado: 'fsfb_externo',
    });
    if (search) params.set('search', search);
    if (catFiltro) params.set('categoria', catFiltro);

    axiosInstance.get(`/medicos/?${params}`, { skipToast: true })
      .then(r => {
        const items = Array.isArray(r.data) ? r.data : (r.data.items ?? []);
        const cnt = Array.isArray(r.data) ? r.data.length : (r.data.total ?? items.length);
        setMedicos(items);
        setTotal(cnt);
      })
      .catch(() => showToast?.('Error cargando médicos FSFB', 'error'))
      .finally(() => setLoading(false));
  }, [page, search, catFiltro]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / SIZE));

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100%', width: '100%' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: 24,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#00103e', lineHeight: 1.2 }}>
            Médicos FSFB
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 3 }}>
            Médicos externos vinculados a FSFB · Estructura simplificada
          </p>
        </div>
        <button
          className="btn-signature"
          onClick={() => navigate('/medicos-fsfb/nuevo')}
        >
          <span className="material-symbols-outlined sm">person_add</span>
          Nuevo médico FSFB
        </button>
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
              Listado médicos FSFB
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
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,172,184,0.12)';
                  e.target.style.background = '#fff';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(197,198,210,0.45)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#f8f9fb';
                }}
                placeholder="Buscar nombre, documento..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Filtro categoría */}
            <div style={{
              display: 'flex', background: '#f2f4f6',
              padding: 3, borderRadius: 9, gap: 2,
            }}>
              {['', 'A', 'AE', 'AP'].map(c => (
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

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: '#f8f9fb',
                borderBottom: '1px solid rgba(197,198,210,0.3)',
              }}>
                {['Documento', 'Nombre', 'Categoría', 'Especialidad', 'Departamento', 'Acciones'].map(h => (
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
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(197,198,210,0.12)' }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div className="skeleton" style={{
                            height: 13, borderRadius: 6,
                            width: j === 1 ? '70%' : '40%',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : medicos.length === 0
                ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                      <span className="material-symbols-outlined"
                        style={{ fontSize: 44, display: 'block', marginBottom: 10, opacity: 0.4 }}>
                        business
                      </span>
                      <p style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9375rem' }}>
                        No se encontraron médicos FSFB
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
                    const cat = safe(m.categoria);
                    const col = CAT_COLORS[cat] ?? { bg: '#e2e8f0', color: '#475569' };
                    return (
                      <tr
                        key={m.documento_identidad + i}
                        style={{
                          borderBottom: '1px solid rgba(197,198,210,0.15)',
                          transition: 'background 100ms', cursor: 'default',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,172,184,0.035)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '11px 16px', fontSize: '0.75rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                          {safe(m.documento_identidad)}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '0.875rem', fontWeight: 600, color: '#00103e', whiteSpace: 'nowrap' }}>
                          {safe(m.nombre_medico)}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{
                            background: col.bg, color: col.color,
                            padding: '2px 10px', borderRadius: 9999,
                            fontSize: '0.6875rem', fontWeight: 700,
                          }}>
                            {cat !== '—' ? `Cat ${cat}` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '0.875rem', color: '#334155' }}>
                          {safe(m.especialidad)}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '0.75rem', color: '#475569' }}>
                          {safe(m.dept_coordinacion_id)}
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <button
                              title="Editar"
                              onClick={() => navigate(`/medicos-fsfb/${m.documento_identidad}/editar`)}
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
                            <button
                              title="Ver perfil"
                              onClick={() => navigate(`/medicos/editar/${m.documento_identidad}`)}
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && total > SIZE && (
          <div style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(197,198,210,0.2)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: '0.75rem',
            color: '#64748b', flexWrap: 'wrap', gap: 8,
          }}>
            <span>{(page - 1) * SIZE + 1}–{Math.min(page * SIZE, total)} de {total}</span>
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