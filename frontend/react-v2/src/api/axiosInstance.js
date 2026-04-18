import axios from 'axios';
import toast from 'react-hot-toast';


console.log('🔍 VITE_API_URL =', import.meta.env.VITE_API_URL);
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});


axiosInstance.interceptors.request.use(
  (config) => {
    // Auth header
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.detail || 'Error inesperado';

    if (error.config?.skipToast) return Promise.reject(error);

    if (status === 401) {
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
    } else if (status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (status === 404) {
      toast.error('El recurso solicitado no fue encontrado.');
    } else if (status === 422) {
      toast.error('Datos inválidos. Revisa los campos del formulario.');
    } else if (status === 500) {
      toast.error(`Error del servidor: ${message}`);
    } else if (!status) {
      toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
