import api from './axios';

export const brandApi = {
  getAll: () =>
    api.get('/brands'),

  create: (data) =>
    api.post('/brands', data),

  update: (id, data) =>
    api.put(`/brands/${id}`, data),

  delete: (id) =>
    api.delete(`/brands/${id}`),
};
