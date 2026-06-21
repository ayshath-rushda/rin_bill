import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import LoginPage from '@/pages/customer/auth/LoginPage';
import { describe, it, expect } from 'vitest';

const createStore = (preloadedState) =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState,
  });

const renderLoginPage = (store) =>
  render(
    <Provider store={store}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </Provider>
  );

describe('LoginPage', () => {
  it('renders the login form', () => {
    const store = createStore();
    renderLoginPage(store);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const store = createStore();
    renderLoginPage(store);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows server error on failed login', async () => {
    const store = createStore({
      auth: { user: null, accessToken: null, isAuthenticated: false, isLoading: false, error: 'Invalid credentials' },
    });
    renderLoginPage(store);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
