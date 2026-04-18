/* ══════════════════════════════════════════════════════════════
   MainLayout.jsx v3.0 — MediWork HSM
   Diseño refinado — sin cambios en lógica
   ══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',         icon: 'dashboard',         path: '/' },
  { label: 'Cuerpo Médico',     icon: 'group',             path: '/medicos' },
  { label: 'Médicos FSFB',      icon: 'business',          path: '/medicos-fsfb' },
  { label: 'Renuncias',         icon: 'assignment_return', path: '/renuncias' },
  { label: 'Finalizaciones',    icon: 'event_busy',        path: '/finalizaciones' },
  { label: 'Personal Inactivo', icon: 'person_off',        path: '/personal-inactivo' },
  { label: 'Reportes',          icon: 'analytics',         path: '/reportes' },
];
const NAV_BOTTOM = [
  { label: 'Configuración', icon: 'settings', path: '/configuracion' },
];

const ROUTE_TITLES = {
  '/':                  'Dashboard',
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
  return ROUTE_TITLES[pathname] ?? 'MediWork HSM';
}

/* ── Panel lateral de notificaciones ─────────────────────────── */
function NotificacionesDrawer({ open, onClose, alertas, loading, navigate }) {
  if (!open) return null;
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
        position: 'fixed', right: 0, top: 0, height: '100%', width: 390,
        zIndex: 100, background: '#fff',
        boxShadow: '-16px 0 48px rgba(10,22,40,0.14)',
        display: 'flex', flexDirection: 'column', fontFamily: 'inherit',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '22px 24px 16px',
          borderBottom: '1px solid rgba(197,198,210,0.28)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: '#fafbfc',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(186,26,26,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize: 16, color: '#ba1a1a' }}>warning</span>
              </div>
              <h3 style={{ fontWeight: 800, color: '#00103e', fontSize: '0.9375rem' }}>
                Alertas de Vencimiento
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 36 }}>
              Documentos críticos próximos a expirar
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: '6px', borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms, color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f2f4f6'; e.currentTarget.style.color = '#00103e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Listado */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton"
                style={{ height: 76, borderRadius: 10, marginBottom: 10 }} />
            ))
          ) : alertas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <span className="material-symbols-outlined"
                style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#0e7e6e', opacity: 0.6 }}>
                check_circle
              </span>
              <p style={{ fontWeight: 700, color: '#334155', fontSize: '0.9375rem' }}>
                Sin alertas activas
              </p>
              <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>
                Todos los documentos están vigentes
              </p>
            </div>
          ) : (
            alertas.map((a, i) => {
              const vencido = (a.dias_restantes ?? 0) <= 0;
              const urgente = !vencido && (a.dias_restantes ?? 99) <= 7;
              const borderColor = vencido ? '#dc2626' : urgente ? '#d97706' : '#f59e0b';
              const bgColor     = vencido ? 'rgba(220,38,38,0.04)' : 'rgba(245,158,11,0.04)';
              const badgeBg     = vencido ? '#fee2e2' : '#fef9c3';
              const badgeColor  = vencido ? '#991b1b' : '#854d0e';
              const badgeLabel  = vencido ? 'Vencido' : `${a.dias_restantes}d restantes`;

              return (
                <div 
                  key={i} 
                  onClick={() => {
                    onClose();
                    if(navigate) navigate(`/medicos/editar/${a.documento_identidad}`);
                    else window.location.href = `/medicos/editar/${a.documento_identidad}`;
                  }}
                  style={{
                  borderLeft: `3px solid ${borderColor}`,
                  background: bgColor,
                  borderRadius: '0 10px 10px 0',
                  padding: '12px 14px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'background 120ms, transform 120ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = vencido ? '#fef2f2' : '#fefce8'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = bgColor; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#00103e', fontSize: '0.8125rem', marginBottom: 2 }}>
                        {a.tipo_documento ?? 'Documento sin tipo'}
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {a.nombre_medico} · {a.documento_identidad}
                      </p>
                    </div>
                    <span style={{
                      background: badgeBg, color: badgeColor,
                      fontSize: '0.625rem', fontWeight: 700,
                      padding: '2px 8px', borderRadius: 9999,
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      {badgeLabel}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                    Vence:{' '}
                    {a.fecha_vencimiento
                      ? new Date(a.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(197,198,210,0.22)',
          background: '#f8f9fb',
        }}>
          <button
            style={{
              width: '100%', padding: '10px 16px',
              background: '#0A1628', color: 'white',
              border: 'none', borderRadius: 9, fontWeight: 700,
              fontSize: '0.8125rem', cursor: 'pointer',
              transition: 'background 150ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0e7e6e'}
            onMouseLeave={e => e.currentTarget.style.background = '#0A1628'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            Ver todas las alertas
          </button>
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

  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const cargarAlertas = useCallback(() => {
    if (alertas.length > 0) return;
    setAlertasLoading(true);
    axiosInstance.get('/notificaciones/vencimientos?dias_limite=30', { skipToast: true })
      .then(r => {
        const data  = r.data;
        const items = Array.isArray(data) ? data : (data?.items ?? []);
        setAlertas(items);
        setAlertasCnt(items.length);
      })
      .catch(() => {})
      .finally(() => setAlertasLoading(false));
  }, [alertas.length]);

  useEffect(() => {
    axiosInstance.get('/notificaciones/vencimientos?dias_limite=30', { skipToast: true })
      .then(r => {
        const data  = r.data;
        const items = Array.isArray(data) ? data : (data?.items ?? []);
        setAlertasCnt(items.length);
        setAlertas(items);
      })
      .catch(() => {});
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
            <h1>MediWork HSM</h1>
            <p>Clinical Admin</p>
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
          {NAV_BOTTOM.map(item => (
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

            {/* Usuario */}
            <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="topbar-user-info" style={{ textAlign: 'right' }}>
                <p className="topbar-user-name">{user?.username || 'Dirección Médica'}</p>
                <p className="topbar-user-role">{user?.rol === 'admin' ? 'Administrador' : 'Usuario'}</p>
              </div>
              <div className="topbar-avatar" aria-hidden="true">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'DM'}
              </div>
              <button 
                onClick={logout} 
                className="topbar-icon-btn" 
                title="Cerrar Sessión"
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
