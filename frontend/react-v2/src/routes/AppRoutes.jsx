import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster }             from 'react-hot-toast';
import { AuthProvider }        from '../context/AuthContext';
import MainLayout              from '../components/Layout/MainLayout';
import ProtectedRoute          from '../components/Auth/ProtectedRoute';
import Login                   from '../pages/auth/Login';
import NoAutorizado            from '../pages/auth/NoAutorizado';
import Dashboard               from '../pages/dashboard/Dashboard';
import FormMedico              from '../pages/medicos/FormMedico';
import PerfilMedico            from '../pages/medicos/PerfilMedico';
import ExpedientePage          from '../pages/medicos/ExpedienteTab';
import ListaFSFB               from '../pages/fsfb/ListaFSFB';
import FormFSFB                from '../pages/fsfb/FormFSFB';
import ListaRenuncias          from '../pages/renuncias/ListaRenuncias';
import ListaFinalizaciones     from '../pages/finalizaciones/ListaFinalizaciones';
import ListaInactivos          from '../pages/personal_inactivo/ListaInactivos';
import Reportes                from '../pages/reportes/Reportes';
import ConfigPage              from '../pages/configuracion/ConfigPage';

// ── Roles del sistema ──────────────────────────────────────────
// admin      : acceso total + gestión de usuarios
// supervisor : crear/editar médicos + cambiar estados
// editor     : crear/editar médicos (sin cambiar estados ni usuarios)
// viewer     : solo lectura
const ROLES_OPERATIVOS = ['admin', 'supervisor', 'editor', 'viewer'];
const ROLES_EDITOR     = ['admin', 'supervisor', 'editor'];
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
          {/* Alias /medicos → mismo Dashboard (navigate('/medicos') post-guardado) */}
          <Route path="/medicos" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Cuerpo Médico — editor, supervisor y admin pueden crear/editar */}
          <Route path="/medicos/nuevo" element={
            <ProtectedRoute roles={ROLES_EDITOR}>
              <MainLayout><FormMedico /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/:doc/editar" element={
            <ProtectedRoute roles={ROLES_EDITOR}>
              <MainLayout><FormMedico /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/:doc/perfil" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><PerfilMedico /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos/:doc/expediente" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ExpedientePage /></MainLayout>
            </ProtectedRoute>
          } />
          {/* Médicos FSFB */}
          <Route path="/medicos-fsfb" element={
            <ProtectedRoute roles={ROLES_OPERATIVOS}>
              <MainLayout><ListaFSFB /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos-fsfb/nuevo" element={
            <ProtectedRoute roles={ROLES_EDITOR}>
              <MainLayout><FormFSFB /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/medicos-fsfb/:documento/editar" element={
            <ProtectedRoute roles={ROLES_EDITOR}>
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
              <MainLayout><ConfigPage /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BrowserRouter>
  );
}
