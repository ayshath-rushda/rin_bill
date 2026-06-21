import api from './axios';

export const inventoryApi = {
  getAll: (params = {}) =>
    api.get('/inventory', { params }),

  getById: (productId) =>
    api.get(`/inventory/${productId}`),

  stockIn: (data) =>
    api.post('/inventory/stock-in', data),

  stockOut: (data) =>
    api.post('/inventory/stock-out', data),

  adjust: (data) =>
    api.post('/inventory/adjust', data),

  getHistory: (params = {}) =>
    api.get('/inventory/history', { params }),

  getLowStock: () =>
    api.get('/inventory/low-stock'),
};
