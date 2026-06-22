import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const EMPTY_DATA = {
  total_medicos:    0,
  total_fsfb:       0,
  alertas_activas:  0,
  total_inactivos:  0,
  renuncias_mes:    0,
  por_categoria:    { A: 0, AE: 0, AP: 0, otros: 0 },
};

export default function useDashboard() {
  const [data,    setData]    = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/dashboard/resumen');
      const r   = res.data;

      // ── Mapear por_categoria al shape que espera el Dashboard ──
      const catMap = { A: 0, AE: 0, AP: 0, otros: 0 };
      r.por_categoria.forEach(({ categoria, total }) => {
        if      (categoria?.startsWith('A -'))  catMap.A  += total;
        else if (categoria?.startsWith('AE -')) catMap.AE += total;
        else if (categoria?.startsWith('AP -')) catMap.AP += total;
        else                                    catMap.otros += total;
      });

      setData({
        total_medicos:   r.totales.total_medicos,
        total_fsfb:      0,   // MW-016 — pendiente tabla CuerpoMedicoFSFB
        alertas_activas: 0,   // MW-015 — pendiente NotificacionVencimiento
        total_inactivos: r.totales.inactivos,
        renuncias_mes:   0,   // MW-017 — pendiente RenunciaMedico
        por_categoria:   catMap,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refresh: fetchData };
}