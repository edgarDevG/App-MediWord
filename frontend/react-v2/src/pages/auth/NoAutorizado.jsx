import { Link } from 'react-router-dom';

export default function NoAutorizado() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 16,
      background: '#f8f9fb', color: '#334155',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#dc2626', opacity: 0.7 }}>
        lock
      </span>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00103e' }}>
        Acceso no autorizado
      </h1>
      <p style={{ fontSize: '0.9375rem', color: '#64748b', maxWidth: 400, textAlign: 'center' }}>
        No tienes permisos suficientes para acceder a esta sección.
        Contacta al administrador si crees que es un error.
      </p>
      <Link
        to="/"
        style={{
          marginTop: 8, padding: '10px 24px', borderRadius: 10,
          background: '#00103e', color: 'white', textDecoration: 'none',
          fontSize: '0.875rem', fontWeight: 700,
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
