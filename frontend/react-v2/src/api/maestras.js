import axiosInstance from './axiosInstance';

export const getDepartamentosDireccion  = () => axiosInstance.get('/maestras/departamentos-direccion-medica');
export const getSecciones               = () => axiosInstance.get('/maestras/secciones');
export const getCategorias              = () => axiosInstance.get('/maestras/categorias-metricas');
export const getDepartamentosMetricas   = () => axiosInstance.get('/maestras/departamentos-metricas');
export const getSeccionesMetricas       = () => axiosInstance.get('/maestras/secciones-metricas');
export const getEspecialidades          = () => axiosInstance.get('/maestras/especialidades');
export const getLugaresExpedicion       = () => axiosInstance.get('/maestras/lugares-expedicion');
export const getLugaresNacimiento       = () => axiosInstance.get('/maestras/lugares-nacimiento');
export const getEstadosPrerrogativas    = () => axiosInstance.get('/maestras/estados-prerrogativas');
export const getCondicionesLaborales    = () => axiosInstance.get('/maestras/condiciones-laborales');