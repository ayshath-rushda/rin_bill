import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import cartReducer from '@/features/cart/cartSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    cart: cartReducer,
  },
});
