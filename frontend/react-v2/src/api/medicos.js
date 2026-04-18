import axiosInstance from './axiosInstance';

// ── CUERPO MÉDICO BASE ─────────────────────────────────────────
export const getMedicos    = (params = {}) => axiosInstance.get('/medicos/', { params });
export const getMedico     = (doc)         => axiosInstance.get(`/medicos/${doc}`);
export const createMedico  = (data)        => axiosInstance.post('/medicos/', data);
export const updateMedico  = (doc, data)   => axiosInstance.put(`/medicos/${doc}`, data);
export const deleteMedico  = (doc)         => axiosInstance.delete(`/medicos/${doc}`);

// ── CONTACTO ───────────────────────────────────────────────────
export const getContacto    = (doc)        => axiosInstance.get(`/medicos/${doc}/contacto`);
export const createContacto = (doc, data)  => axiosInstance.post(`/medicos/${doc}/contacto`, data);
export const updateContacto = (doc, data)  => axiosInstance.put(`/medicos/${doc}/contacto`, data);

// ── DOCUMENTOS HV ──────────────────────────────────────────────
export const getDocumentosHV    = (doc)       => axiosInstance.get(`/medicos/${doc}/documentos-hv`);
export const createDocumentosHV = (doc, data) => axiosInstance.post(`/medicos/${doc}/documentos-hv`, data);
export const updateDocumentosHV = (doc, data) => axiosInstance.put(`/medicos/${doc}/documentos-hv`, data);

// ── DIPLOMAS Y VERIFICACIONES ──────────────────────────────────
export const getDiplomas    = (doc)       => axiosInstance.get(`/medicos/${doc}/diplomas-verificaciones`);
export const createDiplomas = (doc, data) => axiosInstance.post(`/medicos/${doc}/diplomas-verificaciones`, data);
export const updateDiplomas = (doc, data) => axiosInstance.put(`/medicos/${doc}/diplomas-verificaciones`, data);

// ── NORMATIVOS ─────────────────────────────────────────────────
export const getNormativos    = (doc)       => axiosInstance.get(`/medicos/${doc}/normativos`);
export const createNormativos = (doc, data) => axiosInstance.post(`/medicos/${doc}/normativos`, data);
export const updateNormativos = (doc, data) => axiosInstance.put(`/medicos/${doc}/normativos`, data);

// ── CONTRATACIÓN ───────────────────────────────────────────────
export const getContratacion    = (doc)       => axiosInstance.get(`/medicos/${doc}/contratacion`);
export const createContratacion = (doc, data) => axiosInstance.post(`/medicos/${doc}/contratacion`, data);
export const updateContratacion = (doc, data) => axiosInstance.put(`/medicos/${doc}/contratacion`, data);

// ── INGRESO ────────────────────────────────────────────────────
export const getIngreso    = (doc)       => axiosInstance.get(`/medicos/${doc}/ingreso`);
export const createIngreso = (doc, data) => axiosInstance.post(`/medicos/${doc}/ingreso`, data);
export const updateIngreso = (doc, data) => axiosInstance.put(`/medicos/${doc}/ingreso`, data);