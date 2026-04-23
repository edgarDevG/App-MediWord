import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }        from '../context/AuthContext';
import MainLayout              from '../components/Layout/MainLayout';
import ProtectedRoute          from '../components/Auth/ProtectedRoute';
import Login                   from '../pages/auth/Login';
import NoAutorizado            from '../pages/auth/NoAutorizado';
import Dashboard               from '../pages/dashboard/Dashboard';
import ListaMedicos            from '../pages/medicos/ListaMedicos';
import FormMedico              from '../pages/medicos/FormMedico';
import PerfilMedicoPage        from '../pages/medicos/PerfilMedicoPage';
import PerfilMedico            from '../pages/medicos/PerfilMedico';
import ListaFSFB               from '../pages/fsfb/ListaFSFB';
import FormFSFB                from '../pages/fsfb/FormFSFB';
import ListaRenuncias          from '../pages/renuncias/ListaRenuncias';
import ListaFinalizaciones     from '../pages/finalizaciones/ListaFinalizaciones';
import ListaInactivos          from '../pages/personal_inactivo/ListaInactivos';
import Reportes                from '../pages/reportes/Reportes';

// ── Definición de permisos por módulo ──────────────────────────
// admin : acceso total
// user  : módulos operativos, sin Configuración ni acciones destructivas
const ROLES_OPERATIVOS = ['admin', 'user'];
const ROLES_ADMIN      = ['admin'];

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login"         element={<Login />} />
          <Route path="/no-autorizado" element={<NoAutorizado />} />

          {/* Protegidas — envueltas en MainLayout */}
          <Route path="/" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Cuerpo Médico — todos los roles operativos */}
          <Route path="/medicos" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ListaMedicos /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/nuevo" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><FormMedico /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/:doc/editar" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><FormMedico /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/:doc/perfil" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><PerfilMedico /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/:doc/carpetas" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><PerfilMedicoPage /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Médicos FSFB — todos los roles operativos */}
          <Route path="/medicos-fsfb" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ListaFSFB /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos-fsfb/nuevo" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><FormFSFB /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos-fsfb/:documento/editar" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><FormFSFB /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Renuncias / Finalizaciones — todos los roles operativos */}
          <Route path="/renuncias" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ListaRenuncias /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/finalizaciones" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ListaFinalizaciones /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Personal Inactivo — todos pueden ver; reactivación controlada por RoleGuard dentro de la página */}
          <Route path="/personal-inactivo" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ListaInactivos /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Reportes — todos los roles operativos */}
          <Route path="/reportes" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><Reportes /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Configuración — solo admin */}
          <Route path="/configuracion" element={
            <ProtectedRoute roles={ROLES_ADMIN}>
              <MainLayout>
                <div style={{ padding: '2rem', color: '#374151' }}>
                  <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Configuración</h2>
                  <p style={{ color: '#6B7280' }}>Tablas maestras, usuarios y roles (en desarrollo).</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
