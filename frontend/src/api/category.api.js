import api from './axios';

export const categoryApi = {
  getAll: (admin = false) =>
    api.get(admin ? '/categories/all' : '/categories'),

  getBySlug: (slug) =>
    api.get(`/categories/${slug}`),

  create: (data) =>
    api.post('/categories', data),

  update: (id, data) =>
    api.put(`/categories/${id}`, data),

  delete: (id) =>
    api.delete(`/categories/${id}`),
};
