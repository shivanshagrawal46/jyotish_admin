import api from './client';

// ---- Admin notification CRUD (JWT, base = /api/admin) ----
export const listNotifications = (params) => api.get('/notifications', { params }).then((r) => r.data);
export const createNotification = (data) => api.post('/notifications', data).then((r) => r.data);
export const updateNotification = (id, data) => api.put(`/notifications/${id}`, data).then((r) => r.data);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`).then((r) => r.data);
export const toggleNotification = (id) => api.post(`/notifications/${id}/toggle`).then((r) => r.data);
export const resendNotification = (id) => api.post(`/notifications/${id}/resend`).then((r) => r.data);

// ---- Cascading content lookups (public API, base = /api) ----
const pub = (url) => api.get(url, { baseURL: '/api' }).then((r) => r.data);
export const getSections = () => pub('/notification-content/sections');
export const getLevel = (section, index, parentId) => {
  if (index === 0) return pub(`/notification-content/${section}/level1`);
  if (index === 1) return pub(`/notification-content/${section}/level2/${parentId}`);
  if (index === 2) return pub(`/notification-content/${section}/level3/${parentId}`);
  if (index === 3) return pub(`/notification-content/book/level4/${parentId}`);
  return Promise.resolve({ success: true, data: [] });
};
