import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import FormularioMedico from './pages/medicos/FormMedico';
import ListaFSFB from './pages/fsfb/ListaFSFB';
import FormFSFB from './pages/fsfb/FormFSFB';
import ListaRenuncias from './pages/renuncias/ListaRenuncias';
import ListaFinalizaciones from './pages/finalizaciones/ListaFinalizaciones';
import ListaInactivos from './pages/personal_inactivo/ListaInactivos';
import Reportes from './pages/reportes/Reportes';
import Login from './pages/auth/Login';
import { useToast } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';

export default function App() {
  const { showToast, ToastContainer } = useToast();

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas (Envueltas en MainLayout) */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Ruta raíz redirige a /medicos (Dashboard integrado) */}
                  <Route path="/" element={<Navigate to="/medicos" replace />} />

                  {/* Cuerpo Médico — Dashboard + Lista integrada */}
                  <Route path="/medicos" element={<Dashboard showToast={showToast} />} />

                  {/* Formulario Nuevo Médico */}
                  <Route
                    path="/medicos/nuevo"
                    element={<FormularioMedico showToast={showToast} />}
                  />

                  {/* Formulario Editar Médico */}
                  <Route
                    path="/medicos/editar/:documento"
                    element={<FormularioMedico showToast={showToast} />}
                  />

                  {/* Médicos FSFB */}
                  <Route path="/medicos-fsfb" element={<ListaFSFB showToast={showToast} />} />
                  <Route path="/medicos-fsfb/nuevo" element={<FormFSFB showToast={showToast} />} />
                  <Route path="/medicos-fsfb/:documento/editar" element={<FormFSFB showToast={showToast} />} />

                  {/* Renuncias */}
                  <Route path="/renuncias" element={<ListaRenuncias showToast={showToast} />} />

                  {/* Finalizaciones */}
                  <Route path="/finalizaciones" element={<ListaFinalizaciones showToast={showToast} />} />

                  {/* Personal Inactivo */}
                  <Route path="/personal-inactivo" element={<ListaInactivos showToast={showToast} />} />

                  {/* Reportes */}
                  <Route path="/reportes" element={<Reportes />} />

                  {/* 404 fallback */}
                  <Route path="*" element={<Navigate to="/medicos" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
      {/* Toast global — se renderiza fuera del layout para z-index correcto */}
      <ToastContainer />
    </BrowserRouter>
  );
}
