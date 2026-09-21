import api from './client';

// ---- Admin advertisement CRUD (JWT, base = /api/admin) ----
export const listAdvertisements = (params) => api.get('/advertisements', { params }).then((r) => r.data);
export const getAdvertisement = (id) => api.get(`/advertisements/${id}`).then((r) => r.data);
export const createAdvertisement = (data) => api.post('/advertisements', data).then((r) => r.data);
export const updateAdvertisement = (id, data) => api.put(`/advertisements/${id}`, data).then((r) => r.data);
export const deleteAdvertisement = (id) => api.delete(`/advertisements/${id}`).then((r) => r.data);
export const toggleAdvertisement = (id) => api.post(`/advertisements/${id}/toggle`).then((r) => r.data);

// Fixed placements + one per Kosh category, each flagged with `taken`.
export const getPlacements = () => api.get('/advertisements/placements').then((r) => r.data);
