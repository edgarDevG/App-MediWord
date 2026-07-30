import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { resetSessionExpired } from '../api/axiosInstance';
import SessionExpiredModal from '../components/shared/SessionExpiredModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* Restaurar sesión desde localStorage al montar */
    const token      = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try { setUser(JSON.parse(storedUser)); }
      catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    /* Actualizar contexto cuando el SessionExpiredModal renueva la sesión inline */
    const onRenewed = (e) => {
      if (e.detail) {
        setUser(e.detail);
      } else {
        try { setUser(JSON.parse(localStorage.getItem('user') ?? '{}')); } catch { /* noop */ }
      }
    };
    window.addEventListener('session-renewed', onRenewed);
    return () => window.removeEventListener('session-renewed', onRenewed);
  }, []);


  /* login: obtiene access_token (JSON) + refresh_token (cookie httpOnly) */
  const login = async (email, password) => {
    const res      = await axiosInstance.post('/auth/login', { email, password }, { skipToast: true });
    const token    = res.data.access_token;
    const userData = res.data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    resetSessionExpired();   // habilita el modal para futuras expiraciones
    setUser(userData);
    return userData;
  };

  /* logout: limpia cookie en servidor + localStorage + contexto */
  const logout = async (navigateFn) => {
    try { await axiosInstance.post('/auth/logout'); } catch { /* ignorar error de red */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (navigateFn) navigateFn('/login');
  };

  const hasRole = (...roles) => roles.includes(user?.rol);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {!loading && children}
      <SessionExpiredModal />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
