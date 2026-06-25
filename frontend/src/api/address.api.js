import api from './axios';

const extractError = (err) => {
  if (typeof err === 'string') return err;
  if (err?.error?.message) return err.error.message;
  if (err?.message) return err.message;
  return 'Something went wrong';
};

export const addressApi = {
  getAll: () => api.get('/addresses').then((res) => res.data || []),
  create: (data) => api.post('/addresses', data).then((res) => res.data),
  update: (id, data) => api.put(`/addresses/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/addresses/${id}`).then((res) => res.data),
  setDefault: (id) => api.put(`/addresses/${id}/default`).then((res) => res.data),
};

export { extractError };
