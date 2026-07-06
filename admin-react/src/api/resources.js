import api from './client';

const base = (name) => `/resources/${name}`;

export const listResource = (name, params) => api.get(base(name), { params }).then((r) => r.data);
export const getResource = (name, id) => api.get(`${base(name)}/${id}`).then((r) => r.data);
export const createResource = (name, data) => api.post(base(name), data).then((r) => r.data);
export const updateResource = (name, id, data) => api.put(`${base(name)}/${id}`, data).then((r) => r.data);
export const deleteResource = (name, id) => api.delete(`${base(name)}/${id}`).then((r) => r.data);

// Singleton resources (AboutUs, Prashan grids)
export const getSingleton = (name) => api.get(base(name)).then((r) => r.data);
export const saveSingleton = (name, data) => api.put(base(name), data).then((r) => r.data);

// Custom row actions (e.g. notification send)
export const runAction = (name, id, action, data) =>
  api.post(`${base(name)}/${id}/actions/${action}`, data).then((r) => r.data);

// Generic image upload -> returns { url }
export const uploadFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};
