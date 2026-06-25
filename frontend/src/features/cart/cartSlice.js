import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';
import { logout } from '@/features/auth/authSlice';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || { message: 'Failed to fetch cart' });
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/items', { productId, quantity });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || { message: 'Failed to add item' });
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/items/${productId}`, { quantity });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || { message: 'Failed to update item' });
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (productId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/items/${productId}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || { message: 'Failed to remove item' });
  }
});

export const toggleSaveForLater = createAsyncThunk('cart/toggleSaveForLater', async (productId, { rejectWithValue }) => {
  try {
    const res = await api.post(`/cart/items/${productId}/save-for-later`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.error || { message: 'Failed to toggle save for later' });
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.error = null;
      })
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch cart';
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to add item';
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to update item';
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to remove item';
      })
      .addCase(toggleSaveForLater.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      .addCase(toggleSaveForLater.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to toggle save for later';
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
