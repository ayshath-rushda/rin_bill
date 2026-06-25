import api from './axios';

export const orderApi = {
  create: (data) => api.post('/orders', data).then((res) => res.data),
  getAll: (params = {}) => api.get('/orders', { params }).then((res) => res.data || { data: [], meta: {} }),
  getById: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  getAllAdmin: (params = {}) => api.get('/orders/admin', { params }).then((res) => res.data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data).then((res) => res.data),
  assignCourier: (id, data) => api.patch(`/orders/${id}/courier`, data).then((res) => res.data),
  getTracking: (id) => api.get(`/orders/${id}/tracking`).then((res) => res.data),
};
