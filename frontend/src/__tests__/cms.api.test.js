import { describe, it, expect, vi } from 'vitest';
import api from '@/api/axios';
import { cmsApi } from '@/api/cms.api';

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('cmsApi', () => {
  it('getSliders calls GET /cms/sliders', () => {
    cmsApi.getSliders();
    expect(api.get).toHaveBeenCalledWith('/cms/sliders');
  });

  it('getAllSliders calls GET /cms/sliders/all', () => {
    cmsApi.getAllSliders();
    expect(api.get).toHaveBeenCalledWith('/cms/sliders/all');
  });

  it('createSlider calls POST /cms/sliders', () => {
    const data = { title: 'Test' };
    cmsApi.createSlider(data);
    expect(api.post).toHaveBeenCalledWith('/cms/sliders', data);
  });

  it('updateSlider calls PUT /cms/sliders/:id', () => {
    cmsApi.updateSlider('id1', { title: 'Updated' });
    expect(api.put).toHaveBeenCalledWith('/cms/sliders/id1', { title: 'Updated' });
  });

  it('deleteSlider calls DELETE /cms/sliders/:id', () => {
    cmsApi.deleteSlider('id1');
    expect(api.delete).toHaveBeenCalledWith('/cms/sliders/id1');
  });

  it('reorderSliders calls PUT /cms/sliders/reorder', () => {
    const items = [{ id: 'id1', displayOrder: 1 }];
    cmsApi.reorderSliders(items);
    expect(api.put).toHaveBeenCalledWith('/cms/sliders/reorder', { items });
  });

  it('getBanners calls GET /cms/banners', () => {
    cmsApi.getBanners();
    expect(api.get).toHaveBeenCalledWith('/cms/banners');
  });

  it('getAllBanners calls GET /cms/banners/all', () => {
    cmsApi.getAllBanners();
    expect(api.get).toHaveBeenCalledWith('/cms/banners/all');
  });

  it('createBanner calls POST /cms/banners', () => {
    const data = { title: 'Banner' };
    cmsApi.createBanner(data);
    expect(api.post).toHaveBeenCalledWith('/cms/banners', data);
  });

  it('updateBanner calls PUT /cms/banners/:id', () => {
    cmsApi.updateBanner('id1', { title: 'Updated' });
    expect(api.put).toHaveBeenCalledWith('/cms/banners/id1', { title: 'Updated' });
  });

  it('deleteBanner calls DELETE /cms/banners/:id', () => {
    cmsApi.deleteBanner('id1');
    expect(api.delete).toHaveBeenCalledWith('/cms/banners/id1');
  });

  it('getFeaturedProducts calls GET /cms/featured-products', () => {
    cmsApi.getFeaturedProducts();
    expect(api.get).toHaveBeenCalledWith('/cms/featured-products');
  });

  it('getAllFeaturedProducts calls GET /cms/featured-products/all', () => {
    cmsApi.getAllFeaturedProducts();
    expect(api.get).toHaveBeenCalledWith('/cms/featured-products/all');
  });

  it('assignFeatured calls POST /cms/featured-products', () => {
    const data = { productId: 'p1', section: 'featured' };
    cmsApi.assignFeatured(data);
    expect(api.post).toHaveBeenCalledWith('/cms/featured-products', data);
  });

  it('removeFeatured calls DELETE /cms/featured-products/:id', () => {
    cmsApi.removeFeatured('fp1');
    expect(api.delete).toHaveBeenCalledWith('/cms/featured-products/fp1');
  });
});
