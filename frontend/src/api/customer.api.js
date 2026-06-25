import api from './axios';

export const customerApi = {
  getHomepageData: async () => {
    const [sliders, featuredProducts, categories, newArrivals, banners] = await Promise.all([
      api.get('/cms/sliders'),
      api.get('/cms/featured-products'),
      api.get('/categories/top'),
      api.get('/products', { params: { sortBy: 'newest', limit: 8 } }),
      api.get('/cms/banners'),
    ]);
    return {
      sliders: sliders.data || [],
      featuredProducts: featuredProducts.data || { featured: [], best_seller: [], new_arrival: [] },
      categories: categories.data || [],
      newArrivals: newArrivals.data?.data || [],
      banners: banners.data || [],
    };
  },

  getProductListing: (params = {}) =>
    api.get('/products', { params }).then((res) => res.data || {}),

  getProductDetail: (slug) =>
    api.get(`/products/${slug}`).then((res) => res.data || null),

  getRelatedProducts: (slug) =>
    api.get(`/products/${slug}/related`).then((res) => res.data || []),
};
