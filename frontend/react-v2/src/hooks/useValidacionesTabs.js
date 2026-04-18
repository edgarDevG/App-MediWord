import { useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REGLAS = {
  tab1: (d) => {
    const e = {};
    if (!d.documento_identidad?.trim())
      e.documento_identidad = 'El documento es obligatorio.';
    if (!d.nombre_medico?.trim())
      e.nombre_medico = 'El nombre es obligatorio.';
    return e;
  },
  tab2: (hv, contacto) => {
    const e = {};
    if (!contacto.correo?.trim())
      e.correo = 'El correo es obligatorio.';
    else if (!EMAIL_REGEX.test(contacto.correo))
      e.correo = 'Formato de correo inválido.';
    if (!contacto.telefono?.trim())
      e.telefono = 'El teléfono es obligatorio.';
    return e;
  },
};

export default function useValidacionTabs() {
  const [errores, setErrores] = useState({});

  const validarTab = (tab, ...datos) => {
    const fn = REGLAS[tab];
    if (!fn) return true;
    const e = fn(...datos);
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiarErrores = () => setErrores({});

  return { errores, validarTab, limpiarErrores };
}