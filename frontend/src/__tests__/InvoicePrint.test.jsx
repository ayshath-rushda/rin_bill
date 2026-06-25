import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvoicePrint from '@/pages/admin/billing/InvoicePrint';
import { billingApi } from '@/api/billing.api';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/billing.api', () => ({
  billingApi: {
    getInvoicePrint: vi.fn(),
  },
}));

const mockInvoice = {
  _id: 'inv1',
  invoiceNumber: 'INV-20260625-00001',
  type: 'retail',
  subtotal: 2000,
  discount: 0,
  taxTotal: 360,
  total: 2360,
  amountPaid: 2360,
  balance: 0,
  paymentMethod: 'cash',
  paymentStatus: 'completed',
  createdAt: '2026-06-25T10:00:00.000Z',
  customerSnapshot: { name: 'John Doe', gstin: '27ABCDE1234F1Z5' },
  items: [
    { productSnapshot: { name: 'Product A' }, quantity: 2, price: 500, total: 1000 },
    { productSnapshot: { name: 'Product B' }, quantity: 1, price: 1000, total: 1000 },
  ],
};

describe('InvoicePrint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invoice header', async () => {
    billingApi.getInvoicePrint.mockResolvedValue({ data: mockInvoice });
    render(
      <MemoryRouter initialEntries={['/admin/billing/invoices/inv1/print']}>
        <Routes>
          <Route path="/admin/billing/invoices/:id/print" element={<InvoicePrint />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('RINBILL STORE')).toBeInTheDocument();
    });
  });

  it('displays invoice number', async () => {
    billingApi.getInvoicePrint.mockResolvedValue({ data: mockInvoice });
    render(
      <MemoryRouter initialEntries={['/admin/billing/invoices/inv1/print']}>
        <Routes>
          <Route path="/admin/billing/invoices/:id/print" element={<InvoicePrint />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/INV-20260625-00001/)).toBeInTheDocument();
    });
  });

  it('displays customer name', async () => {
    billingApi.getInvoicePrint.mockResolvedValue({ data: mockInvoice });
    render(
      <MemoryRouter initialEntries={['/admin/billing/invoices/inv1/print']}>
        <Routes>
          <Route path="/admin/billing/invoices/:id/print" element={<InvoicePrint />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });
  });

  it('displays total amount', async () => {
    billingApi.getInvoicePrint.mockResolvedValue({ data: mockInvoice });
    render(
      <MemoryRouter initialEntries={['/admin/billing/invoices/inv1/print']}>
        <Routes>
          <Route path="/admin/billing/invoices/:id/print" element={<InvoicePrint />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      const totals = screen.getAllByText('₹2360.00');
      expect(totals.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows thank you message', async () => {
    billingApi.getInvoicePrint.mockResolvedValue({ data: mockInvoice });
    render(
      <MemoryRouter initialEntries={['/admin/billing/invoices/inv1/print']}>
        <Routes>
          <Route path="/admin/billing/invoices/:id/print" element={<InvoicePrint />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Thank You/)).toBeInTheDocument();
    });
  });

  it('shows not found for missing invoice', async () => {
    billingApi.getInvoicePrint.mockRejectedValue(new Error('Not found'));
    render(
      <MemoryRouter initialEntries={['/admin/billing/invoices/bad/print']}>
        <Routes>
          <Route path="/admin/billing/invoices/:id/print" element={<InvoicePrint />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Invoice not found')).toBeInTheDocument();
    });
  });
});
