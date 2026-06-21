import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import AdminRoute from '@/routes/AdminRoute';
import { describe, it, expect } from 'vitest';

const createStore = (authState) =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: { auth: authState },
  });

describe('AdminRoute', () => {
  it('redirects unauthenticated users', () => {
    const store = createStore({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/account/login" element={<div>Login Page</div>} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<div>Admin Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('allows super admin', () => {
    const store = createStore({
      user: { _id: '1', name: 'Admin', role: { name: 'super_admin', permissions: ['*'] } },
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<div>Admin Dashboard</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
