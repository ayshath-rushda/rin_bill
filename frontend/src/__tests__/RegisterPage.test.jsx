import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import RegisterPage from '@/pages/customer/auth/RegisterPage';
import { describe, it, expect } from 'vitest';

const createStore = (preloadedState) =>
  configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState,
  });

const renderRegisterPage = (store) =>
  render(
    <Provider store={store}>
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    </Provider>
  );

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    const store = createStore();
    renderRegisterPage(store);
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  });

  it('validates password match', async () => {
    const store = createStore();
    renderRegisterPage(store);
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[1], { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });
});
