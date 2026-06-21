import api from './axios';

export const productApi = {
  list: (params = {}) =>
    api.get('/products', { params }),

  getBySlug: (slug) =>
    api.get(`/products/${slug}`),

  getById: (id) =>
    api.get(`/products/${id}`),

  getFeatured: () =>
    api.get('/products/featured'),

  create: (data) =>
    api.post('/products', data),

  update: (id, data) =>
    api.put(`/products/${id}`, data),

  delete: (id) =>
    api.delete(`/products/${id}`),

  uploadImages: (id, formData, type = 'main') => {
    formData.append('type', type);
    return api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage: (id, imageId) =>
    api.delete(`/products/${id}/images/${imageId}`),
};
