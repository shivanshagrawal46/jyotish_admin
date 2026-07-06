import api from './client';

// ---- Auth ----
export const login = (username, password) =>
  api.post('/login', { username, password }).then((r) => r.data);

// ---- Upload ----
export const uploadImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post('/kosh/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

// ---- Categories ----
export const getCategories = () => api.get('/kosh/categories').then((r) => r.data);
export const createCategory = (data) => api.post('/kosh/categories', data).then((r) => r.data);
export const updateCategory = (id, data) => api.put(`/kosh/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/kosh/categories/${id}`).then((r) => r.data);

// ---- Sub-categories ----
export const getSubCategories = (categoryId) =>
  api.get(`/kosh/categories/${categoryId}/subcategories`).then((r) => r.data);
export const createSubCategory = (data) => api.post('/kosh/subcategories', data).then((r) => r.data);
export const updateSubCategory = (id, data) => api.put(`/kosh/subcategories/${id}`, data).then((r) => r.data);
export const deleteSubCategory = (id) => api.delete(`/kosh/subcategories/${id}`).then((r) => r.data);

// ---- Content ----
export const getContents = (subId, params) =>
  api.get(`/kosh/subcategories/${subId}/contents`, { params }).then((r) => r.data);
export const createContent = (data) => api.post('/kosh/contents', data).then((r) => r.data);
export const updateContent = (id, data) => api.put(`/kosh/contents/${id}`, data).then((r) => r.data);
export const deleteContent = (id) => api.delete(`/kosh/contents/${id}`).then((r) => r.data);

// ---- Excel import / export ----
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

export const downloadContentTemplate = (subId) =>
  downloadBlob(`/kosh/subcategories/${subId}/template-excel`, 'kosh_content_template.xlsx');

export const exportContentExcel = (subId) =>
  downloadBlob(`/kosh/subcategories/${subId}/export-excel`, 'kosh_content.xlsx');

export const importContentExcel = (subId, file) => {
  const form = new FormData();
  form.append('excel', file);
  return api
    .post(`/kosh/subcategories/${subId}/import-excel`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
