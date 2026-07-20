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

// ---- Excel template / export / import (any resource with an `excel` config) ----
const downloadBlob = (url, fallbackName) =>
  api.get(url, { responseType: 'blob' }).then((r) => {
    const cd = r.headers['content-disposition'] || '';
    const match = cd.match(/filename="?([^";]+)"?/);
    const name = match ? match[1] : fallbackName;
    const href = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(href);
  });

const withParent = (url, parent) => (parent ? `${url}?parent=${encodeURIComponent(parent)}` : url);

export const downloadResourceTemplate = (name, parent) =>
  downloadBlob(withParent(`${base(name)}/template-excel`, parent), `${name}_template.xlsx`);

export const exportResourceExcel = (name, parent) =>
  downloadBlob(withParent(`${base(name)}/export-excel`, parent), `${name}.xlsx`);

export const importResourceExcel = (name, parent, file) => {
  const form = new FormData();
  form.append('excel', file);
  return api
    .post(withParent(`${base(name)}/import-excel`, parent), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
