import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const CATEGORIAS = [
  { value: '', label: 'Todas las Categorías' },
  { value: 'AUTH', label: 'Autenticación (AUTH)' },
  { value: 'CRUD', label: 'Datos Maestros (CRUD)' },
  { value: 'LIFECYCLE', label: 'Ciclo de Vida (LIFECYCLE)' },
  { value: 'ACCESS', label: 'Accesos/Consultas (ACCESS)' },
];

const SEVERITY_COLORS = {
  INFO: { bg: '#e0f2fe', color: '#0369a1' },
  WARNING: { bg: '#fef08a', color: '#a16207' },
  CRITICAL: { bg: '#fecaca', color: '#b91c1c' },
};

export default function AuditLogs() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');

  const fetchLogs = async () => {
    if (user?.rol !== 'admin') return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (category) params.append('event_category', category);
      params.append('limit', 500);

      const res = await axiosInstance.get(`/audit/logs?${params.toString()}`);
      setLogs(res.data);
    } catch (e) {
      showToast('Error al cargar auditoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, category]);

  if (user?.rol !== 'admin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 10 }}>lock</span>
        <h4>Acceso Restringido</h4>
        <p>Solo los administradores pueden ver los registros de auditoría (Ley 1581).</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: '#f8fafc', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Fecha Inicial</label>
          <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', width: 140 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Fecha Final</label>
          <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', width: 140 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Categoría</label>
          <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px 12px', width: 220 }}>
            {CATEGORIAS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <button onClick={fetchLogs} className="btn-primary" style={{ padding: '8px 16px', height: '40px' }} disabled={loading}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>refresh</span>
          Refrescar
        </button>
      </div>

      {/* Tabla de Resultados */}
      <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: 900 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <tr>
                <th style={{ width: 150 }}>Fecha/Hora</th>
                <th style={{ width: 180 }}>Usuario</th>
                <th style={{ width: 200 }}>Médico Afectado</th>
                <th style={{ width: 120 }}>Categoría</th>
                <th style={{ width: 140 }}>Acción</th>
                <th>Severidad</th>
                <th style={{ width: 80, textAlign: 'center' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Cargando logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay registros para estos filtros.</td></tr>
              ) : (
                logs.map(log => {
                  const severityConfig = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.INFO;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8125rem', color: '#475569' }}>
                        {new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0A1628', fontSize: '0.875rem' }}>
                        {log.usuario_nombre}
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>{log.ip_address}</div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{log.medico_nombre}</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: '#f1f5f9', color: '#475569' }}>
                          {log.event_category || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace', fontWeight: 600 }}>{log.action}</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: severityConfig.bg, color: severityConfig.color }}>
                          {log.severity || 'INFO'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <button onClick={() => setSelectedLog(log)} style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', padding: 4 }}>
                            <span className="material-symbols-outlined">data_object</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalles JSON */}
      {selectedLog && (
        <>
          <div onClick={() => setSelectedLog(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.5)', zIndex: 9998, backdropFilter: 'blur(3px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#1e293b', color: '#f8fafc', padding: '1.5rem', borderRadius: 12,
            width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', zIndex: 9999,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Detalles de Cambios (Delta)</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: '0.8125rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(selectedLog.changes, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
