/* ══════════════════════════════════════════════════════════════
   ListaRenuncias.jsx — MediWork HSM v2
   Listado de médicos con estado RENUNCIA
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const safe = (v) => (v === undefined || v === null || v === '') ? '—' : v;

export default function ListaRenuncias({ showToast }) {
  const navigate = useNavigate();
  const [medicos, setMedicos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const SIZE = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: SIZE, estado: 'RENUNCIA' });
    if (search) params.set('search', search);

    axiosInstance.get(`/medicos/?${params}`, { skipToast: true })
      .then(r => {
        const items = Array.isArray(r.data) ? r.data : (r.data.items ?? []);
        const cnt = Array.isArray(r.data) ? r.data.length : (r.data.total ?? items.length);
        setMedicos(items);
        setTotal(cnt);
      })
      .catch(() => showToast?.('Error cargando renuncias', 'error'))
      .finally(() => setLoading(false));
  }, [page, search]);

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
            Renuncias
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 3 }}>
            Historial de médicos con renuncia registrada
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fef2f2', border: '1px solid #fecaca',
          padding: '8px 14px', borderRadius: 10,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#dc2626' }}>
            assignment_return
          </span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991b1b' }}>
            {total} {total === 1 ? 'registro' : 'registros'}
          </span>
        </div>
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
                fontSize: '0.8125rem', width: 300, outline: 'none',
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
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
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
                {['Documento', 'Nombre', 'Categoría', 'Especialidad', 'Fecha Ingreso', 'Estado'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
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
                        assignment_return
                      </span>
                      <p style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9375rem' }}>
                        No se encontraron renuncias
                      </p>
                      {search && (
                        <p style={{ fontSize: '0.8125rem', marginTop: 4, color: '#94a3b8' }}>
                          Intenta con otro término de búsqueda
                        </p>
                      )}
                    </td>
                  </tr>
                )
                : medicos.map((m, i) => (
                    <tr
                      key={m.documento_identidad + i}
                      style={{
                        borderBottom: '1px solid rgba(197,198,210,0.15)',
                        transition: 'background 100ms', cursor: 'default',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.02)'}
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
                          background: '#f3e8ff', color: '#6b21a8',
                          padding: '2px 10px', borderRadius: 9999,
                          fontSize: '0.6875rem', fontWeight: 700,
                        }}>
                          {safe(m.categoria)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.875rem', color: '#334155' }}>
                        {safe(m.especialidad)}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', color: '#475569' }}>
                        {m.fecha_ingreso
                          ? new Date(m.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: '0.8125rem', fontWeight: 600, color: '#dc2626',
                          background: 'rgba(220,38,38,0.08)', padding: '3px 10px', borderRadius: 9999,
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
                          Renuncia
                        </span>
                      </td>
                    </tr>
                  ))
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
