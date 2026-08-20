/* ══════════════════════════════════════════════════════════════
   MainLayout.jsx v4.0 — MediWork HSM
   Usa NotificacionesPanel v4 (self-contained, dropdown categorizado)
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificacionesPanel from '../NotificacionesPanel';

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
  return ROUTE_TITLES[pathname] ?? 'MedIndex';
}

/* ── Layout principal ─────────────────────────────────────────── */
export default function MainLayout({ children }) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* Pantalla completa */
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

  /* Colapsar sidebar automáticamente en perfil */
  useEffect(() => {
    if (location.pathname.match(/\/medicos(-fsfb)?\/.+\/perfil/)) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          {collapsed ? (
            <div className="sidebar-logo-mi" aria-label="MedIndex">
              <span className="sidebar-logo-mi-med">M</span>
              <span className="sidebar-logo-mi-index">I</span>
            </div>
          ) : (
            <div className="sidebar-logo-row">
              <div className="sidebar-logo-icon-badge" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" width="16" height="16">
                  <rect x="13" y="4" width="6" height="24" rx="2" fill="white"/>
                  <rect x="4" y="13" width="24" height="6" rx="2" fill="white"/>
                </svg>
              </div>
              <div className="sidebar-logo-wordmark">
                <div className="sidebar-logo-wordmark-type">
                  <span className="slw-med">Med</span><span className="slw-index">Index</span>
                </div>
                <p className="sidebar-logo-sub">Hospital Serena del Mar</p>
              </div>
            </div>
          )}
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
            <p className="sidebar-version">v2.0 · CHSM</p>
          )}
        </div>
      </aside>

      {/* MAIN AREA */}
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

            {/* Notificaciones v4 — dropdown self-contained */}
            <NotificacionesPanel />

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

    </div>
  );
}
