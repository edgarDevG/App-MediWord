import axiosInstance from './axiosInstance';

// Obtiene el resumen de KPIs del dashboard.
// Cuando MW-012 esté listo, este endpoint retornará datos reales.
export const getDashboardResumen = () =>
  axiosInstance.get('/dashboard/resumen');