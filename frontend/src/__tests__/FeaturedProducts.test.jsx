import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import FeaturedProducts from '@/pages/admin/cms/FeaturedProducts';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/cms.api', () => ({
  cmsApi: {
    getAllFeaturedProducts: vi.fn(() => Promise.resolve({ data: [] })),
    assignFeatured: vi.fn(() => Promise.resolve({ data: {} })),
    removeFeatured: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('@/api/product.api', () => ({
  productApi: {
    list: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  },
}));

const createStore = () =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
  });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderFeaturedProducts = () =>
  render(
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <FeaturedProducts />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );

describe('FeaturedProducts', () => {
  it('renders the page title', () => {
    renderFeaturedProducts();
    expect(screen.getByText('Featured Products')).toBeInTheDocument();
  });

  it('renders section tabs', () => {
    renderFeaturedProducts();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Best Sellers')).toBeInTheDocument();
    expect(screen.getByText('New Arrivals')).toBeInTheDocument();
  });

  it('renders empty state message', async () => {
    renderFeaturedProducts();
    expect(screen.getByText(/no products assigned/i)).toBeInTheDocument();
  });
});
