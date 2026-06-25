import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import InvoiceList from '@/pages/admin/billing/InvoiceList';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/billing.api', () => ({
  billingApi: {
    listInvoices: vi.fn(),
  },
}));

const mockInvoices = {
  data: [
    { _id: '1', invoiceNumber: 'INV-001', type: 'retail', total: 1000, amountPaid: 1000, balance: 0, paymentStatus: 'completed', createdAt: '2026-06-25T10:00:00.000Z', customerSnapshot: { name: 'John' } },
    { _id: '2', invoiceNumber: 'INV-002', type: 'wholesale', total: 5000, amountPaid: 2000, balance: 3000, paymentStatus: 'partial', createdAt: '2026-06-24T10:00:00.000Z', customerSnapshot: { name: 'Jane Corp' } },
  ],
  meta: { page: 1, totalPages: 1, total: 2 },
};

const createStore = (preloadedState) =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState,
  });

const renderInvoiceList = (store) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/billing/invoices']}>
        <Routes>
          <Route path="/admin/billing/invoices" element={<InvoiceList />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('InvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { billingApi } = require('@/api/billing.api');
    billingApi.listInvoices.mockResolvedValue(mockInvoices);
  });

  it('renders the page title', async () => {
    const store = createStore();
    renderInvoiceList(store);
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('renders invoice rows', async () => {
    const store = createStore();
    renderInvoiceList(store);
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
    });
  });

  it('shows new invoice button', () => {
    const store = createStore();
    renderInvoiceList(store);
    expect(screen.getByText('New Invoice')).toBeInTheDocument();
  });

  it('shows filters', async () => {
    const store = createStore();
    renderInvoiceList(store);
    await waitFor(() => {
      expect(screen.getByText('All types')).toBeInTheDocument();
      expect(screen.getByText('All statuses')).toBeInTheDocument();
    });
  });

  it('shows empty state when no invoices', async () => {
    const { billingApi } = require('@/api/billing.api');
    billingApi.listInvoices.mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0, total: 0 } });
    const store = createStore();
    renderInvoiceList(store);
    await waitFor(() => {
      expect(screen.getByText('No invoices found')).toBeInTheDocument();
    });
  });
});
