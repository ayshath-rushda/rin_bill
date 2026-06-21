import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, clearCredentials } from '@/features/auth/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  it('returns initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('handles setCredentials', () => {
    const user = { _id: '1', name: 'Test', email: 'test@test.com', role: { name: 'customer' } };
    const accessToken = 'test-token';
    const state = authReducer(initialState, setCredentials({ user, accessToken }));
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(accessToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('handles clearCredentials', () => {
    const loggedIn = {
      user: { _id: '1', name: 'Test' },
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
    const state = authReducer(loggedIn, clearCredentials());
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
