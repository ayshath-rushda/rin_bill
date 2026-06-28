import api from './axios';

export const reportApi = {
  getSales: (params = {}) =>
    api.get('/reports/sales', { params }).then((res) => res.data || { records: [], summary: { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 } }),

  getInventoryStock: (params = {}) =>
    api.get('/reports/inventory/stock', { params }).then((res) => res.data),

  getInventoryMovement: (params = {}) =>
    api.get('/reports/inventory/movement', { params }).then((res) => res.data),

  getOrders: (params = {}) =>
    api.get('/reports/orders', { params }).then((res) => res.data || { records: [], summary: { totalOrders: 0, totalRevenue: 0 } }),

  getTopCustomers: (limit = 10) =>
    api.get('/reports/customers/top', { params: { limit } }).then((res) => res.data),

  getCustomerPurchases: (customerId, params = {}) =>
    api.get('/reports/customers/purchases', { params: { customerId, ...params } }).then((res) => res.data),

  exportSales: (format, params = {}) =>
    api.get('/reports/export/sales', { params: { format, ...params }, responseType: 'blob' }),

  exportInventory: () =>
    api.get('/reports/export/inventory', { responseType: 'blob' }),
};
