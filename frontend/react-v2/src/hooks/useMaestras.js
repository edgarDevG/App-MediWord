import { useState, useEffect } from 'react';
import {
  getDepartamentosDireccion,
  getSecciones,
  getCategorias,
  getDepartamentosMetricas,
  getSeccionesMetricas,
  getEspecialidades,
  getLugaresExpedicion,
  getLugaresNacimiento,
  getEstadosPrerrogativas,
  getCondicionesLaborales,
} from '../api/maestras';
import toast from 'react-hot-toast';

const useMaestras = () => {
  const [maestras, setMaestras] = useState({
    departamentos: [],
    secciones: [],
    categorias: [],
    departamentosMetricas: [],
    seccionesMetricas: [],
    especialidades: [],
    lugaresExpedicion: [],
    lugaresNacimiento: [],
    estadosPrerrogativas: [],
    condicionesLaborales: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarMaestras = async () => {
      try {
        const [
          depDireccion,
          secciones,
          categorias,
          depMetricas,
          secMetricas,
          especialidades,
          lugaresExp,
          lugaresNac,
          estadosPrer,
          condLaborales,
        ] = await Promise.all([
          getDepartamentosDireccion(),
          getSecciones(),
          getCategorias(),
          getDepartamentosMetricas(),
          getSeccionesMetricas(),
          getEspecialidades(),
          getLugaresExpedicion(),
          getLugaresNacimiento(),
          getEstadosPrerrogativas(),
          getCondicionesLaborales(),
        ]);

        setMaestras({
          departamentos:        depDireccion.data,
          secciones:            secciones.data,
          categorias:           categorias.data,
          departamentosMetricas: depMetricas.data,
          seccionesMetricas:    secMetricas.data,
          especialidades:       especialidades.data,
          lugaresExpedicion:    lugaresExp.data,
          lugaresNacimiento:    lugaresNac.data,
          estadosPrerrogativas: estadosPrer.data,
          condicionesLaborales: condLaborales.data,
        });
      } catch (err) {
        setError(err);
        toast.error('Error al cargar los catálogos del formulario.');
      } finally {
        setLoading(false);
      }
    };

    cargarMaestras();
  }, []); // Solo se ejecuta al montar — no en cada tab

  return { ...maestras, loading, error };
};

export default useMaestras;