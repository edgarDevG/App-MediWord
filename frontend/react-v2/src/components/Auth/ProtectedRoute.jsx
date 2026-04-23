import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta define roles permitidos y el usuario no tiene uno de ellos
  if (roles && roles.length > 0 && !roles.includes(user.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}
