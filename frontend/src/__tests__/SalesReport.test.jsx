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
    getSales: vi.fn(() =>
      Promise.resolve({
        records: [
          { period: '2026-06-01', totalOrders: 5, totalRevenue: 25000, averageOrderValue: 5000 },
          { period: '2026-06-02', totalOrders: 3, totalRevenue: 12000, averageOrderValue: 4000 },
        ],
        summary: { totalOrders: 8, totalRevenue: 37000, averageOrderValue: 4625 },
      })
    ),
    exportSales: vi.fn(() => Promise.resolve({ data: new Blob(['test']) })),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>Grid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div>Cell</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div>Line</div>,
}));

import SalesReport from '@/pages/admin/reports/SalesReport';

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

function renderSalesReport() {
  render(
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SalesReport />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('T9.5 - SalesReport', () => {
  it('renders page title', async () => {
    renderSalesReport();
    expect(screen.getByText('Sales Report')).toBeInTheDocument();
  });

  it('renders KPI cards with fetched data', async () => {
    renderSalesReport();
    await waitFor(() => {
      expect(screen.getByText('₹37,000')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('renders period tabs and switches period', async () => {
    renderSalesReport();
    await waitFor(() => {
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Yearly')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Weekly'));
    await waitFor(() => {
      expect(screen.getByText('Weekly').className).toContain('bg-primary');
    });
  });

  it('renders export buttons', async () => {
    renderSalesReport();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('renders chart area', async () => {
    renderSalesReport();
    await waitFor(() => {
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    });
  });
});
