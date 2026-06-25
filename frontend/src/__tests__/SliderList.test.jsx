import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import SliderList from '@/pages/admin/cms/SliderList';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/cms.api', () => ({
  cmsApi: {
    getAllSliders: vi.fn(() => Promise.resolve({ data: [] })),
    createSlider: vi.fn(() => Promise.resolve({ data: {} })),
    updateSlider: vi.fn(() => Promise.resolve({ data: {} })),
    deleteSlider: vi.fn(() => Promise.resolve({ data: {} })),
    reorderSliders: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

const createStore = () =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
  });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderSliderList = () =>
  render(
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SliderList />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );

describe('SliderList', () => {
  it('renders the page title', () => {
    renderSliderList();
    expect(screen.getByText('Sliders')).toBeInTheDocument();
  });

  it('renders Add Slider button', () => {
    renderSliderList();
    expect(screen.getByText('Add Slider')).toBeInTheDocument();
  });

  it('renders drag reorder hint', () => {
    renderSliderList();
    expect(screen.getByText(/drag the grip/i)).toBeInTheDocument();
  });
});
