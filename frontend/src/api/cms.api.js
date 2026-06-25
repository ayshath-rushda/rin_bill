import api from './axios';

export const cmsApi = {
  /* Sliders */
  getSliders: () =>
    api.get('/cms/sliders'),

  getAllSliders: () =>
    api.get('/cms/sliders/all'),

  createSlider: (data) =>
    api.post('/cms/sliders', data),

  updateSlider: (id, data) =>
    api.put(`/cms/sliders/${id}`, data),

  deleteSlider: (id) =>
    api.delete(`/cms/sliders/${id}`),

  reorderSliders: (items) =>
    api.put('/cms/sliders/reorder', { items }),

  /* Banners */
  getBanners: () =>
    api.get('/cms/banners'),

  getAllBanners: () =>
    api.get('/cms/banners/all'),

  createBanner: (data) =>
    api.post('/cms/banners', data),

  updateBanner: (id, data) =>
    api.put(`/cms/banners/${id}`, data),

  deleteBanner: (id) =>
    api.delete(`/cms/banners/${id}`),

  /* Featured Products */
  getFeaturedProducts: () =>
    api.get('/cms/featured-products'),

  getAllFeaturedProducts: () =>
    api.get('/cms/featured-products/all'),

  assignFeatured: (data) =>
    api.post('/cms/featured-products', data),

  removeFeatured: (id) =>
    api.delete(`/cms/featured-products/${id}`),

  /* Image Upload */
  uploadImage: (formData) =>
    api.post('/cms/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
