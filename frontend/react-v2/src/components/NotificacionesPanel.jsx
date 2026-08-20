import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

/* ══════════════════════════════════════════════════════════════
   NotificacionesPanel v4 — Alertas categorizadas por medico
   Endpoint: GET /notificaciones/resumen-categorizado
   ══════════════════════════════════════════════════════════════ */

const NIVEL_CFG = {
  critico: { color: '#ba1a1a', bg: 'rgba(186,26,26,0.07)', badge: '#ba1a1a', label: 'Vencido',    icon: 'cancel'   },
  urgente: { color: '#b45309', bg: 'rgba(180,83,9,0.06)',  badge: '#d97706', label: 'Urgente',    icon: 'warning'  },
  proximo: { color: '#1a4ed7', bg: 'rgba(26,78,215,0.05)', badge: '#1a4ed7', label: 'Por vencer', icon: 'schedule' },
};

const FILTROS = [
  { id: 'todos',   label: 'Todos'    },
  { id: 'critico', label: 'Vencidos' },
  { id: 'urgente', label: 'Urgentes' },
  { id: 'proximo', label: 'Proximos' },
];

// eslint-disable-next-line no-unused-vars
const NIVEL_ORDER = { critico: 0, urgente: 1, proximo: 2 };

function initials(name) {
  if (!name) return '?';
  const clean = name.replace(/^Dr[a]?\.?\s+/i, '').trim();
  return clean.split(/\s+/).slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase() || '?';
}

const AVATAR_PALETTE = [
  { bg: 'rgba(26,78,215,0.12)',  color: '#1a4ed7' },
  { bg: 'rgba(6,95,70,0.12)',    color: '#065f46' },
  { bg: 'rgba(109,40,217,0.12)', color: '#6d28d9' },
  { bg: 'rgba(180,83,9,0.12)',   color: '#b45309' },
  { bg: 'rgba(186,26,26,0.12)',  color: '#ba1a1a' },
];

function avatarColor(nombre) {
  const code = (nombre ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

function diasLabel(dias) {
  if (dias < 0)   return `Vencido hace ${Math.abs(dias)}d`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias}d`;
}

function NivelBadge({ nivel, small = false }) {
  const cfg = NIVEL_CFG[nivel] ?? NIVEL_CFG.proximo;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: small ? '0.5625rem' : '0.625rem', fontWeight: 700, flexShrink: 0,
      color: cfg.badge, background: cfg.badge + '18',
      padding: small ? '1px 5px' : '2px 7px', borderRadius: 9999,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: small ? 9 : 11, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function ItemRow({ item }) {
  const cfg = NIVEL_CFG[item.nivel] ?? NIVEL_CFG.proximo;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px 5px 28px', borderBottom: '1px solid rgba(197,198,210,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: cfg.color, flexShrink: 0 }}>fiber_manual_record</span>
        <span style={{ fontSize: '0.6875rem', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</span>
      </div>
      <span style={{ fontSize: '0.625rem', color: cfg.color, fontWeight: 600, flexShrink: 0, marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>{diasLabel(item.dias)}</span>
    </div>
  );
}

function CategoriaRow({ cat, isExpanded, onToggle }) {
  const cfg = NIVEL_CFG[cat.nivel] ?? NIVEL_CFG.proximo;
  return (
    <div>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 16px', background: isExpanded ? cfg.badge + '0a' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms', borderBottom: '1px solid rgba(197,198,210,0.15)' }}
        onMouseEnter={e => { e.currentTarget.style.background = cfg.badge + '12'; }}
        onMouseLeave={e => { e.currentTarget.style.background = isExpanded ? cfg.badge + '0a' : 'transparent'; }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: cfg.color }}>{cat.icon}</span>
        <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{cat.label}</span>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: cfg.badge, background: cfg.badge + '18', padding: '1px 6px', borderRadius: 9999 }}>{cat.total}</span>
        <NivelBadge nivel={cat.nivel} small />
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}>expand_more</span>
      </button>
      {isExpanded && (
        <div style={{ background: 'rgba(248,250,252,0.8)' }}>
          {cat.items.map((item, i) => <ItemRow key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}

function MedicoCard({ item, isExpanded, expandedCats, onToggleMedico, onToggleCat, onNavigate }) {
  const nv = NIVEL_CFG[item.nivel] ?? NIVEL_CFG.proximo;
  const av = avatarColor(item.nombre_medico);
  const nombreCorto = (item.nombre_medico ?? '').replace(/^Dr[a]?\.?\s+/i, '').split(' ').slice(0, 3).join(' ');
  return (
    <div style={{ borderBottom: '1px solid rgba(197,198,210,0.2)' }}>
      <div onClick={onToggleMedico} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: isExpanded ? nv.bg : 'transparent', cursor: 'pointer', transition: 'background 120ms' }}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800 }}>{initials(item.nombre_medico)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#00103e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{nombreCorto}</p>
            <NivelBadge nivel={item.nivel} />
          </div>
          <p style={{ fontSize: '0.625rem', color: '#94a3b8', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {item.total_alertas} {item.total_alertas === 1 ? 'alerta' : 'alertas'}
            {item.vencidos > 0 && <span style={{ color: '#ba1a1a', fontWeight: 700 }}> · {item.vencidos} vencido{item.vencidos !== 1 ? 's' : ''}</span>}
            {' · '}{item.categorias.length} cat.
          </p>
        </div>
        <button onClick={e => { e.stopPropagation(); onNavigate(item); }} title="Ver perfil"
          style={{ background: 'none', border: '1px solid rgba(197,198,210,0.5)', borderRadius: 6, cursor: 'pointer', padding: '3px 5px', color: '#64748b', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 120ms' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a4ed7'; e.currentTarget.style.color = '#1a4ed7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(197,198,210,0.5)'; e.currentTarget.style.color = '#64748b'; }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
        </button>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}>expand_more</span>
      </div>
      {isExpanded && (
        <div style={{ background: '#fafcff' }}>
          {item.categorias.map(cat => (
            <CategoriaRow key={cat.id} cat={cat} isExpanded={expandedCats.has(cat.id)} onToggle={() => onToggleCat(cat.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════ */
export default function NotificacionesPanel() {
  const navigate = useNavigate();
  const [open,         setOpen]         = useState(false);
  const [items,        setItems]        = useState([]);
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [noService,    setNoService]    = useState(false);
  const [filtro,       setFiltro]       = useState('todos');
  const [expandedMedicos, setExpandedMedicos] = useState(new Set());
  const [expandedCats,    setExpandedCats]    = useState({});

  const fetchAlertas = useCallback(async () => {
    if (noService) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/notificaciones/resumen-categorizado', { skipToast: true });
      const data = res.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalAlertas(data.total_alertas ?? 0);
    } catch {
      setNoService(true);
    } finally {
      setLoading(false);
    }
  }, [noService]);

  useEffect(() => {
    fetchAlertas();
    const iv = setInterval(fetchAlertas, 60_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsFiltrados = filtro === 'todos' ? items : items.filter(i => i.nivel === filtro);

  const toggleMedico = (doc) =>
    setExpandedMedicos(prev => { const n = new Set(prev); n.has(doc) ? n.delete(doc) : n.add(doc); return n; });

  const toggleCat = (doc, catId) =>
    setExpandedCats(prev => {
      const s = prev[doc] ? new Set(prev[doc]) : new Set();
      s.has(catId) ? s.delete(catId) : s.add(catId);
      return { ...prev, [doc]: s };
    });

  const irAlPerfil = (item) => {
    navigate('/medicos/' + item.documento_identidad + '/perfil');
    setOpen(false);
  };

  const hayExpanded = expandedMedicos.size > 0;
  const expandirTodo = () => setExpandedMedicos(new Set(itemsFiltrados.map(i => i.documento_identidad)));
  const colapsarTodo = () => { setExpandedMedicos(new Set()); setExpandedCats({}); };

  return (
    <div style={{ position: 'relative' }}>
      {/* Boton campana */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-icon"
        id="btn-notificaciones-panel"
        title={noService ? 'Servicio no disponible' : 'Alertas de vencimiento'}
        style={{ position: 'relative', opacity: noService ? 0.5 : 1 }}
      >
        <span className="material-symbols-outlined">{noService ? 'notifications_off' : 'notifications'}</span>
        {totalAlertas > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9999,
            background: '#ba1a1a', color: 'white', fontSize: '0.6875rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1, boxShadow: '0 0 0 2px white', animation: 'pulse 2s infinite',
          }}>
            {totalAlertas > 99 ? '99+' : totalAlertas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 10px)',
            width: 420, maxHeight: 600, background: 'white',
            borderRadius: '0.875rem', border: '1px solid rgba(197,198,210,0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>

            {/* Header */}
            <div style={{ padding: '14px 16px 0', background: '#fcfcfd', borderBottom: '1px solid rgba(197,198,210,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#00103e' }}>Alertas de vencimiento</span>
                  {items.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: '0.6875rem', fontWeight: 700, color: '#ba1a1a', background: 'rgba(186,26,26,0.08)', padding: '2px 8px', borderRadius: 9999 }}>
                      {items.length} {items.length === 1 ? 'medico' : 'medicos'} · {totalAlertas} alertas
                    </span>
                  )}
                </div>
                <button onClick={hayExpanded ? colapsarTodo : expandirTodo}
                  style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                  {hayExpanded ? 'Colapsar todo' : 'Expandir todo'}
                </button>
              </div>
              {/* Chips de filtro */}
              <div style={{ display: 'flex', gap: 6, paddingBottom: 10, overflowX: 'auto' }}>
                {FILTROS.map(f => {
                  const count = f.id === 'todos' ? items.length : items.filter(i => i.nivel === f.id).length;
                  const isActive = filtro === f.id;
                  const cfg = f.id !== 'todos' ? NIVEL_CFG[f.id] : null;
                  return (
                    <button key={f.id} onClick={() => setFiltro(f.id)} style={{
                      padding: '3px 10px', borderRadius: 9999, flexShrink: 0,
                      border: isActive ? ('1.5px solid ' + (cfg ? cfg.badge : '#1a4ed7')) : '1.5px solid rgba(197,198,210,0.5)',
                      background: isActive ? (cfg ? cfg.badge + '12' : 'rgba(26,78,215,0.08)') : 'transparent',
                      color: isActive ? (cfg ? cfg.badge : '#1a4ed7') : '#64748b',
                      fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 120ms',
                    }}>
                      {f.label}{count > 0 ? ' (' + count + ')' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cuerpo */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(197,198,210,0.2)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 13, borderRadius: 6, marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 10, borderRadius: 6, width: '60%' }} />
                    </div>
                  </div>
                ))
              ) : noService ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }}>cloud_off</span>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>Servicio no disponible</p>
                  <button onClick={() => { setNoService(false); fetchAlertas(); }} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(197,198,210,0.5)', background: 'white', fontSize: '0.75rem', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
                    Reintentar
                  </button>
                </div>
              ) : itemsFiltrados.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }}>check_circle</span>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
                    {filtro === 'todos' ? 'Sin alertas pendientes' : 'Sin alertas en esta categoria'}
                  </p>
                  {filtro === 'todos' && <p style={{ fontSize: '0.75rem', color: '#b0bec5', marginTop: 4 }}>Todos los documentos estan al dia</p>}
                </div>
              ) : itemsFiltrados.map(item => (
                <MedicoCard
                  key={item.documento_identidad}
                  item={item}
                  isExpanded={expandedMedicos.has(item.documento_identidad)}
                  expandedCats={expandedCats[item.documento_identidad] ?? new Set()}
                  onToggleMedico={() => toggleMedico(item.documento_identidad)}
                  onToggleCat={(catId) => toggleCat(item.documento_identidad, catId)}
                  onNavigate={irAlPerfil}
                />
              ))}
            </div>

            {/* Footer */}
            {itemsFiltrados.length > 0 && (
              <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(197,198,210,0.25)', background: '#fcfcfd', textAlign: 'center' }}>
                <p style={{ fontSize: '0.625rem', color: '#94a3b8', margin: 0 }}>
                  Normativos: 30d · Contratacion: 20d · Actualiza cada minuto
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px white; }
          50%       { box-shadow: 0 0 0 4px rgba(186,26,26,0.3); }
        }
      `}</style>
    </div>
  );
}
