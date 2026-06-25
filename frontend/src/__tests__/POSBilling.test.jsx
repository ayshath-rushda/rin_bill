import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import POSBilling from '@/pages/admin/billing/POSBilling';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/billing.api', () => ({
  billingApi: {
    searchProducts: vi.fn(),
    searchCustomers: vi.fn(),
    createInvoice: vi.fn(),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const createStore = (preloadedState) =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState,
  });

const renderPOSBilling = (store) =>
  render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>
          <POSBilling />
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  );

describe('POSBilling', () => {
  it('renders the POS billing page title', () => {
    const store = createStore();
    renderPOSBilling(store);
    expect(screen.getByText('POS Billing')).toBeInTheDocument();
    expect(screen.getByText('Retail')).toBeInTheDocument();
    expect(screen.getByText('Wholesale')).toBeInTheDocument();
  });

  it('shows empty cart message initially', () => {
    const store = createStore();
    renderPOSBilling(store);
    expect(screen.getByText('Empty Cart')).toBeInTheDocument();
  });

  it('has a search input', () => {
    const store = createStore();
    renderPOSBilling(store);
    expect(screen.getByPlaceholderText(/search by code/i)).toBeInTheDocument();
  });

  it('toggles between retail and wholesale mode', () => {
    const store = createStore();
    renderPOSBilling(store);
    const wholesaleBtn = screen.getByText('Wholesale');
    expect(wholesaleBtn).toBeInTheDocument();
    fireEvent.click(wholesaleBtn);
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });
});
