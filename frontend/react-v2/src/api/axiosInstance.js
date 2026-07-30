import axios from 'axios';
import toast from 'react-hot-toast';

/* ── Instancia principal ──────────────────────────────────────
   withCredentials: true → el browser incluye la cookie
   httpOnly (refresh_token) en cada request a /api/v1/auth/*     */
const axiosInstance = axios.create({
  baseURL:          import.meta.env.VITE_API_URL,
  timeout:          15000,
  headers:          { 'Content-Type': 'application/json' },
  withCredentials:  true,
});

/* ── Instancia separada solo para refresh ─────────────────────
   Usa una instancia sin interceptores para evitar ciclos
   infinitos cuando el request interceptor llama a /auth/refresh  */
const _refreshApi = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  timeout:         10000,
  withCredentials: true,
});


/* ── Estado del ciclo de refresco ────────────────────────────  */
let isSessionExpired = false;
let isRefreshing     = false;
let pendingQueue     = [];   // requests que llegaron mientras se refrescaba

export const resetSessionExpired = () => { isSessionExpired = false; };

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
};

const doRefresh = async () => {
  const res = await _refreshApi.post('/auth/refresh');
  const newToken = res.data.access_token;
  localStorage.setItem('token', newToken);
  return newToken;
};


/* ══ REQUEST interceptor ═════════════════════════════════════
   Adjunta el Bearer token vigente en localStorage.             */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);


/* ══ RESPONSE interceptor ════════════════════════════════════
   En un 401 (token vencido):
   1. Si ya hay un refresh en curso → encolar el request.
   2. Si no → intentar refresh con la cookie httpOnly.
   3. Si el refresh falla → dispara 'session-expired' (modal).
   4. Requests encolados se reintentán o rechazan según resultado. */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status          = error.response?.status;
    const url             = error.config?.url  ?? '';
    const originalRequest = error.config;

    /* ── 401: intentar renovar sesión automáticamente ── */
    if (
      status === 401 &&
      !originalRequest._retry &&
      !url.includes('/auth/')        // no reintentar en endpoints de auth
    ) {
      /* Hay otro refresh en curso → encolar y esperar su resultado */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing           = true;

      try {
        const newToken = await doRefresh();
        flushQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);       // reintento con token nuevo
      } catch (refreshError) {
        /* El refresh también falló → sesión realmente expirada */
        flushQueue(refreshError, null);
        if (!isSessionExpired) {
          isSessionExpired = true;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    /* ── Otros errores: mostrar toast ── */
    if (error.config?.skipToast) return Promise.reject(error);

    const message = error.response?.data?.detail ?? 'Error inesperado';
    if      (status === 403)  toast.error('No tienes permisos para realizar esta acción.');
    else if (status === 404)  toast.error('El recurso solicitado no fue encontrado.');
    else if (status === 422)  toast.error('Datos inválidos. Revisa los campos del formulario.');
    else if (status === 500)  toast.error(`Error del servidor: ${message}`);
    else if (!status)         toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');

    return Promise.reject(error);
  },
);

export default axiosInstance;
