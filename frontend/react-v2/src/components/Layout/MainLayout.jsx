/* ══════════════════════════════════════════════════════════════
   MainLayout.jsx v3.0 — MediWork HSM
   Diseño refinado — sin cambios en lógica
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Cuerpo Médico',     icon: 'group',             path: '/' },
  { label: 'Médicos FSFB',      icon: 'business',          path: '/medicos-fsfb' },
  { label: 'Renuncias',         icon: 'assignment_return', path: '/renuncias' },
  { label: 'Finalizaciones',    icon: 'event_busy',        path: '/finalizaciones' },
  { label: 'Personal Inactivo', icon: 'person_off',        path: '/personal-inactivo' },
  { label: 'Reportes',          icon: 'analytics',         path: '/reportes' },
];
const NAV_BOTTOM = [
  { label: 'Configuración', icon: 'settings', path: '/configuracion', adminOnly: true },
];

const ROL_LABELS = {
  admin:      'Administrador',
  supervisor: 'Supervisor',
  editor:     'Editor',
  viewer:     'Solo lectura',
  user:       'Usuario',
};

const ROUTE_TITLES = {
  '/':                  'Cuerpo Médico',
  '/medicos':           'Cuerpo Médico',
  '/medicos/nuevo':     'Nuevo Médico',
  '/medicos-fsfb':      'Médicos FSFB',
  '/renuncias':         'Renuncias',
  '/finalizaciones':    'Finalizaciones',
  '/personal-inactivo': 'Personal Inactivo',
  '/reportes':          'Reportes',
  '/configuracion':     'Configuración',
};

function getTitle(pathname) {
  if (pathname.match(/\/medicos\/.+\/editar/)) return 'Editar Médico';
  if (pathname.match(/\/medicos-fsfb\/.+\/editar/)) return 'Editar Médico FSFB';
  if (pathname.startsWith('/medicos-fsfb/nuevo')) return 'Nuevo Médico FSFB';
  return ROUTE_TITLES[pathname] ?? 'MediWord HSM';
}

/* ── Helpers para el drawer ───────────────────────────────────── */
const NIVEL_CFG = {
  critico: { color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)', badge: '#ba1a1a', badgeBg: '#fee2e2', label: 'Vencido',    icon: 'cancel'   },
  urgente: { color: '#b45309', bg: 'rgba(180,83,9,0.07)',  badge: '#b45309', badgeBg: '#fef3c7', label: 'Urgente',    icon: 'warning'  },
  proximo: { color: '#1a4ed7', bg: 'rgba(26,78,215,0.05)', badge: '#1a4ed7', badgeBg: '#dbeafe', label: 'Por vencer', icon: 'schedule' },
};

const AVATAR_PAL = [
  { bg: 'rgba(26,78,215,0.13)',  color: '#1a4ed7' },
  { bg: 'rgba(6,95,70,0.13)',    color: '#065f46' },
  { bg: 'rgba(109,40,217,0.13)', color: '#6d28d9' },
  { bg: 'rgba(180,83,9,0.13)',   color: '#b45309' },
  { bg: 'rgba(186,26,26,0.13)',  color: '#ba1a1a' },
];
function drawerAvatar(nombre) {
  const code = (nombre ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PAL[code % AVATAR_PAL.length];
}
function drawerInitials(name) {
  if (!name) return '?';
  const clean = name.replace(/^Dr[a]?\.?\s+/i, '').trim();
  return clean.split(/\s+/).slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase() || '?';
}

/* ── Panel lateral de notificaciones ─────────────────────────── */
function NotificacionesDrawer({ open, onClose, alertas, loading, navigate }) {
  const [descartados, setDescartados] = useState(new Set());

  useEffect(() => {
    if (!open) setDescartados(new Set());
  }, [open]);

  if (!open) return null;

  const visibles = alertas.filter(a => !descartados.has(a.documento_identidad));

  const irAlPerfil = (item) => {
    onClose();
    const ruta = `/medicos/${item.documento_identidad}/perfil`;
    navigate(ruta);
  };

  const descartar = (e, doc) => {
    e.stopPropagation();
    setDescartados(prev => new Set([...prev, doc]));
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,22,40,0.22)',
          zIndex: 90, backdropFilter: 'blur(2px)',
        }}
      />
      <aside style={{
        position: 'fixed', right: 0, top: 0, height: '100%', width: 400,
        zIndex: 100, background: '#fff',
        boxShadow: '-16px 0 48px rgba(10,22,40,0.14)',
        display: 'flex', flexDirection: 'column', fontFamily: 'inherit',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '20px 22px 14px',
          borderBottom: '1px solid rgba(197,198,210,0.28)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: '#fafbfc',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h3 style={{ fontWeight: 800, color: '#00103e', fontSize: '0.9375rem', margin: 0 }}>
                Alertas de vencimiento
              </h3>
              {visibles.length > 0 && (
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700,
                  color: '#ba1a1a', background: 'rgba(186,26,26,0.09)',
                  padding: '2px 9px', borderRadius: 9999,
                }}>
                  {visibles.length} {visibles.length === 1 ? 'médico' : 'médicos'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
              Documentos vencidos o próximos a expirar (30 días)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: '6px', borderRadius: 7,
              display: 'flex', alignItems: 'center',
              transition: 'background 120ms, color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#00103e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Listado */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px', marginBottom: 8, borderRadius: 12, background: '#f8f9fb' }}>
                <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, borderRadius: 6, marginBottom: 7 }} />
                  <div className="skeleton" style={{ height: 10, borderRadius: 6, width: '72%' }} />
                </div>
              </div>
            ))
          ) : visibles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <span className="material-symbols-outlined"
                style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#34d399' }}>
                check_circle
              </span>
              <p style={{ fontWeight: 700, color: '#334155', fontSize: '0.9375rem' }}>
                Sin alertas activas
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: 4 }}>
                Todos los documentos están vigentes
              </p>
            </div>
          ) : (
            visibles.map(item => {
              const nv  = NIVEL_CFG[item.nivel] ?? NIVEL_CFG.proximo;
              const av  = drawerAvatar(item.nombre_medico);
              const ini = drawerInitials(item.nombre_medico);
              const nombreCorto = (item.nombre_medico ?? '').replace(/^Dr[a]?\.?\s+/i, '').split(' ').slice(0, 3).join(' ');

              return (
                <div
                  key={item.documento_identidad}
                  onClick={() => irAlPerfil(item)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '13px 14px',
                    marginBottom: 8,
                    borderRadius: 12,
                    background: nv.bg,
                    border: `1px solid ${nv.badge}20`,
                    cursor: 'pointer',
                    transition: 'filter 130ms, transform 130ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.96)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                    background: av.bg, color: av.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800, letterSpacing: '-0.02em',
                  }}>
                    {ini}
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <p style={{
                        fontSize: '0.8125rem', fontWeight: 700, color: '#00103e',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1, minWidth: 0, margin: 0,
                      }}>
                        {nombreCorto}
                      </p>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                        fontSize: '0.625rem', fontWeight: 700,
                        color: nv.badge, background: nv.badgeBg,
                        padding: '2px 8px', borderRadius: 9999,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>{nv.icon}</span>
                        {nv.label}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.6875rem', color: '#64748b', margin: '0 0 3px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}>
                      {item.resumen}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: '#94a3b8', margin: 0 }}>
                      {item.total_alertas} {item.total_alertas === 1 ? 'alerta' : 'alertas'} · Toca para ver el perfil →
                    </p>
                  </div>

                  {/* Descartar */}
                  <button
                    onClick={e => descartar(e, item.documento_identidad)}
                    title="Descartar"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 4, color: '#94a3b8', borderRadius: 6, flexShrink: 0,
                      transition: 'color 120ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(197,198,210,0.22)',
          background: '#f8f9fb',
        }}>
          <p style={{ fontSize: '0.6875rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            Alertas de los próximos 30 días · Se actualiza al abrir
          </p>
        </div>
      </aside>
    </>
  );
}

/* ── Layout principal ─────────────────────────────────────────── */
export default function MainLayout({ children }) {
  const [collapsed,      setCollapsed]      = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [alertas,        setAlertas]        = useState([]);
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertasCnt,     setAlertasCnt]     = useState(0);
  const [isFullscreen,   setIsFullscreen]   = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.match(/\/medicos(-fsfb)?\/.+\/perfil/)) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const cargarAlertas = useCallback(() => {
    if (alertas.length > 0) return;
    setAlertasLoading(true);
    axiosInstance.get('/notificaciones/resumen-medico?dias_limite=30', { skipToast: true })
      .then(r => {
        const items = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setAlertas(items);
        setAlertasCnt(items.length);
      })
      .catch(() => {})
      .finally(() => setAlertasLoading(false));
  }, [alertas.length]);

  useEffect(() => {
    const fetchAlerts = () => {
      axiosInstance.get('/notificaciones/resumen-medico?dias_limite=30', { skipToast: true })
        .then(r => {
          const items = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
          setAlertasCnt(items.length);
          setAlertas(items);
        })
        .catch(() => {});
    };

    fetchAlerts();

    window.addEventListener('refresh-alerts', fetchAlerts);
    return () => window.removeEventListener('refresh-alerts', fetchAlerts);
  }, []);

  const handleNotifClick = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) cargarAlertas();
  };

  return (
    <div className="app-shell">

      {/* ══ SIDEBAR ══ */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            {/* SVG logo inline — cruz médica */}
            <svg viewBox="0 0 32 32" fill="none" width="18" height="18">
              <rect x="13" y="4" width="6" height="24" rx="2" fill="white"/>
              <rect x="4" y="13" width="24" height="6" rx="2" fill="white"/>
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>MediWord HSM</h1>
            <p>Hospital Serena del Mar</p>
          </div>
        </div>

        {/* Nav principal */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
              data-tooltip={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <span className={`material-symbols-outlined${isActive(item.path) ? ' filled' : ''}`}>
                {item.icon}
              </span>
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer nav */}
        <div className="sidebar-footer">
          {NAV_BOTTOM.filter(item => !item.adminOnly || user?.rol === 'admin').map(item => (
            <button
              key={item.path}
              className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
              data-tooltip={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}
          {!collapsed && (
            <p className="sidebar-version">MediWork v2.0 · CHSM</p>
          )}
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div className={`main-area${collapsed ? ' sidebar-collapsed' : ''}`}>

        {/* TopBar */}
        <header className="topbar">

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="topbar-icon-btn"
              onClick={() => setCollapsed(c => !c)}
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <span className="material-symbols-outlined">
                {collapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            <span className="topbar-title">{getTitle(location.pathname)}</span>
          </div>

          <div className="topbar-actions">
            {/* Notificaciones */}
            <button
              id="btn-notificaciones-panel"
              className="topbar-icon-btn"
              aria-label={`Notificaciones${alertasCnt > 0 ? ` (${alertasCnt} alertas)` : ''}`}
              onClick={handleNotifClick}
              disabled={location.pathname.includes('/nuevo') || location.pathname.includes('/editar')}
              style={{
                position: 'relative',
                opacity: (location.pathname.includes('/nuevo') || location.pathname.includes('/editar')) ? 0.3 : 1,
                cursor: (location.pathname.includes('/nuevo') || location.pathname.includes('/editar')) ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="material-symbols-outlined">notifications</span>
              {alertasCnt > 0 && (
                <span
                  aria-label={`${alertasCnt} alertas`}
                  style={{
                    position: 'absolute', top: 5, right: 5,
                    minWidth: 17, height: 17, borderRadius: 9999,
                    background: '#dc2626', color: 'white',
                    fontSize: '0.5625rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', border: '2px solid white', lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {alertasCnt > 99 ? '99+' : alertasCnt}
                </span>
              )}
            </button>

            <div className="topbar-divider" />

            {/* Fullscreen */}
            <button
              className="topbar-icon-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              style={!isFullscreen ? {
                animation: 'fs-pulse 2.2s ease-in-out infinite',
                color: '#10b981',
              } : {}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
              <style>{`
                @keyframes fs-pulse {
                  0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.0); transform: scale(1);    background: transparent; }
                  40%  { box-shadow: 0 0 0 6px rgba(16,185,129,0.22); transform: scale(1.13); background: rgba(16,185,129,0.10); }
                  70%  { box-shadow: 0 0 0 10px rgba(16,185,129,0.0); transform: scale(1.06); background: rgba(16,185,129,0.05); }
                  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.0); transform: scale(1);    background: transparent; }
                }
              `}</style>
            </button>

            <div className="topbar-divider" />

            {/* Usuario */}
            <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="topbar-user-info" style={{ textAlign: 'right' }}>
                <p className="topbar-user-name">{user?.nombre || user?.username || 'Dirección Médica'}</p>
                <p className="topbar-user-role">{ROL_LABELS[user?.rol] ?? 'Usuario'}</p>
              </div>
              <div className="topbar-avatar" aria-hidden="true">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'DM'}
              </div>
              <button
                onClick={() => logout(navigate)}
                className="topbar-icon-btn"
                title="Cerrar Sesión"
                style={{ marginLeft: '4px', color: '#dc2626' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Panel lateral de notificaciones */}
      <NotificacionesDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        alertas={alertas}
        loading={alertasLoading}
        navigate={navigate}
      />
    </div>
  );
}
