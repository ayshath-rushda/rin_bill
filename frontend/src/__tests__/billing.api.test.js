import { describe, it, expect, vi } from 'vitest';
import api from '@/api/axios';
import { billingApi } from '@/api/billing.api';

const mockResponse = { data: { success: true, data: [] } };

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve(mockResponse)),
    post: vi.fn(() => Promise.resolve(mockResponse)),
  },
}));

describe('billingApi', () => {
  it('searchProducts calls GET /billing/search/product with q param', async () => {
    await billingApi.searchProducts('test');
    expect(api.get).toHaveBeenCalledWith('/billing/search/product', { params: { q: 'test' } });
  });

  it('searchCustomers calls GET /billing/search/customers', async () => {
    await billingApi.searchCustomers('John', 'wholesale');
    expect(api.get).toHaveBeenCalledWith('/billing/search/customers', { params: { q: 'John', type: 'wholesale' } });
  });

  it('createInvoice calls POST /billing/invoices', async () => {
    const data = { items: [{ productId: 'p1', quantity: 2 }], paymentMethod: 'cash' };
    await billingApi.createInvoice(data);
    expect(api.post).toHaveBeenCalledWith('/billing/invoices', data);
  });

  it('listInvoices calls GET /billing/invoices with params', async () => {
    await billingApi.listInvoices({ page: 1, type: 'retail' });
    expect(api.get).toHaveBeenCalledWith('/billing/invoices', { params: { page: 1, type: 'retail' } });
  });

  it('getInvoice calls GET /billing/invoices/:id', async () => {
    await billingApi.getInvoice('inv1');
    expect(api.get).toHaveBeenCalledWith('/billing/invoices/inv1');
  });

  it('getInvoicePrint calls GET /billing/invoices/:id/print', async () => {
    await billingApi.getInvoicePrint('inv1');
    expect(api.get).toHaveBeenCalledWith('/billing/invoices/inv1/print');
  });

  it('recordPayment calls POST /payments', async () => {
    const data = { invoiceId: 'inv1', amount: 500, method: 'cash' };
    await billingApi.recordPayment(data);
    expect(api.post).toHaveBeenCalledWith('/payments', data);
  });
});
