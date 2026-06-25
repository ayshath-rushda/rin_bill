import api from './axios';

export const cartApi = {
  getCart: () => api.get('/cart').then((res) => res.data || { items: [] }),
  addItem: (productId, quantity = 1) =>
    api.post('/cart/items', { productId, quantity }).then((res) => res.data || { items: [] }),
  updateItem: (productId, quantity) =>
    api.put(`/cart/items/${productId}`, { quantity }).then((res) => res.data || { items: [] }),
  removeItem: (productId) =>
    api.delete(`/cart/items/${productId}`).then((res) => res.data || { items: [] }),
  toggleSaveForLater: (productId) =>
    api.post(`/cart/items/${productId}/save-for-later`).then((res) => res.data || { items: [] }),
};
