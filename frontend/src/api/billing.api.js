import api from './axios';

export const billingApi = {
  searchProducts: (q) =>
    api.get('/billing/search/product', { params: { q } }).then((res) => res.data || []),

  searchCustomers: (q, type) =>
    api.get('/billing/search/customers', { params: { q, type } }).then((res) => res.data || []),

  createInvoice: (data) =>
    api.post('/billing/invoices', data).then((res) => res.data),

  listInvoices: (params = {}) =>
    api.get('/billing/invoices', { params }).then((res) => res.data || {}),

  getInvoice: (id) =>
    api.get(`/billing/invoices/${id}`).then((res) => res.data),

  getInvoicePrint: (id) =>
    api.get(`/billing/invoices/${id}/print`).then((res) => res.data),

  recordPayment: (data) =>
    api.post('/payments', data).then((res) => res.data),
};
