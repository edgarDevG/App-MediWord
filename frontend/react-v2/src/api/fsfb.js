import axiosInstance from './axiosInstance';

export const getMedicosFSFB  = (params = {}) => axiosInstance.get('/medicos-fsfb/', { params });
export const getMedicoFSFB   = (doc)         => axiosInstance.get(`/medicos-fsfb/${doc}`);
export const createMedicoFSFB = (data)       => axiosInstance.post('/medicos-fsfb/', data);
export const updateMedicoFSFB = (doc, data)  => axiosInstance.put(`/medicos-fsfb/${doc}`, data);
export const deleteMedicoFSFB = (doc)        => axiosInstance.delete(`/medicos-fsfb/${doc}`);