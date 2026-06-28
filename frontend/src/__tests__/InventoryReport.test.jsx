import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/features/auth/authSlice', () => ({
  default: (state = { user: null, accessToken: null, isAuthenticated: false, isLoading: false }) => state,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  updateProfile: vi.fn(),
  setCredentials: vi.fn(),
  clearCredentials: vi.fn(),
}));

vi.mock('@/features/ui/uiSlice', () => ({
  default: (state = { sidebarOpen: true, theme: 'light' }) => state,
  toggleSidebar: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

vi.mock('@/api/report.api', () => ({
  reportApi: {
    getInventoryStock: vi.fn(() =>
      Promise.resolve({
        data: [
          { _id: '1', code: 'P001', name: 'Product A', sku: 'SKU-A', category: { name: 'Cat1' }, stock: 50, lowStockLimit: 10, status: 'active' },
          { _id: '2', code: 'P002', name: 'Product B', sku: 'SKU-B', category: { name: 'Cat2' }, stock: 3, lowStockLimit: 5, status: 'active' },
        ],
        meta: { page: 1, totalPages: 1, total: 2 },
      })
    ),
    getInventoryMovement: vi.fn(() =>
      Promise.resolve({
        data: [
          { _id: 'm1', product: { name: 'Product A' }, type: 'stock_in', quantity: 10, previousStock: 5, newStock: 15, reason: 'Restock', user: { name: 'Admin' }, createdAt: '2026-06-26T10:00:00Z' },
        ],
        meta: { page: 1, totalPages: 1, total: 1 },
      })
    ),
    exportInventory: vi.fn(() => Promise.resolve({ data: new Blob(['test']) })),
  },
}));

import InventoryReport from '@/pages/admin/reports/InventoryReport';

const createStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
      ui: () => ({ sidebarOpen: true, theme: 'light' }),
    },
  });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderInventoryReport() {
  render(
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <InventoryReport />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('T9.6 - InventoryReport', () => {
  it('renders page title', () => {
    renderInventoryReport();
    expect(screen.getByText('Inventory Report')).toBeInTheDocument();
  });

  it('renders stock tab by default', async () => {
    renderInventoryReport();
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
  });

  it('switches to movement tab', async () => {
    renderInventoryReport();
    fireEvent.click(screen.getByText('Movement'));
    await waitFor(() => {
      expect(screen.getByText('Stock Movement History')).toBeInTheDocument();
    });
  });

  it('renders export button', async () => {
    renderInventoryReport();
    await waitFor(() => {
      expect(screen.getByText('Export Excel')).toBeInTheDocument();
    });
  });
});
