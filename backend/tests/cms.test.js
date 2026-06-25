import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Product from '../src/models/Product.js';
import Slider from '../src/models/Slider.js';
import Banner from '../src/models/Banner.js';
import FeaturedProduct from '../src/models/FeaturedProduct.js';

jest.setTimeout(30000);

let superAdminToken;
let ecomStaffToken;
let customerToken;
let testProduct;

const buildSlider = (overrides = {}) => ({
  title: 'Test Slider',
  subtitle: 'A subtitle',
  description: 'Slider description',
  buttonText: 'Shop Now',
  buttonUrl: '/products',
  bannerImage: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
  displayOrder: 0,
  isActive: true,
  ...overrides,
});

const buildBanner = (overrides = {}) => ({
  title: 'Test Banner',
  image: 'https://res.cloudinary.com/demo/image/upload/v1/banner.jpg',
  url: '/promo',
  position: 'top',
  isActive: true,
  ...overrides,
});

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill_test');

  const adminRole = await Role.findOne({ name: 'super_admin' });
  const ecomRole = await Role.findOne({ name: 'ecommerce_staff' });
  const customerRole = await Role.findOne({ name: 'customer' });

  if (adminRole) {
    const adminUser = await User.findOne({ email: 'admin@rinbill.com' });
    if (adminUser) {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@rinbill.com', password: 'Admin@123' });
      superAdminToken = loginRes.body.data.accessToken;
    }
  }

  if (ecomRole) {
    const ecomUser = await User.findOne({ email: 'cms-ecom@test.com' });
    if (!ecomUser) {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'CMS Ecom', email: 'cms-ecom@test.com', password: 'password123', confirmPassword: 'password123' });
      await User.findByIdAndUpdate(regRes.body.data.user._id, { role: ecomRole._id, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cms-ecom@test.com', password: 'password123' });
      ecomStaffToken = loginRes.body.data.accessToken;
    } else {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cms-ecom@test.com', password: 'password123' });
      ecomStaffToken = loginRes.body.data.accessToken;
    }
  }

  if (customerRole) {
    const custUser = await User.findOne({ email: 'cms-customer@test.com' });
    if (!custUser) {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'CMS Customer', email: 'cms-customer@test.com', password: 'password123', confirmPassword: 'password123' });
      customerToken = regRes.body.data.accessToken;
    } else {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cms-customer@test.com', password: 'password123' });
      customerToken = loginRes.body.data.accessToken;
    }
  }

  testProduct = await Product.create({
    name: 'CMS Test Product',
    code: 'CMS-TEST-001',
    sku: 'CMS-TEST-SKU-001',
    sellingPrice: 100,
    stock: 10,
    status: 'active',
  });
});

afterAll(async () => {
  await Slider.deleteMany({ title: /^Test Slider/ });
  await Banner.deleteMany({ title: /^Test Banner/ });
  await FeaturedProduct.deleteMany({ product: testProduct._id });
  await Product.deleteMany({ code: /^CMS-TEST/ });
  await User.deleteMany({ email: { $in: ['cms-ecom@test.com', 'cms-customer@test.com'] } });
  await mongoose.connection.close();
});

/* ---------- Slider ---------- */

describe('Slider CRUD', () => {
  let sliderId;

  it('should create a slider', async () => {
    const res = await request(app)
      .post('/api/cms/sliders')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildSlider());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Slider');
    sliderId = res.body.data._id;
  });

  it('should return 400 for missing title', async () => {
    const res = await request(app)
      .post('/api/cms/sliders')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildSlider({ title: undefined }));
    expect(res.status).toBe(400);
  });

  it('should get all sliders (admin)', async () => {
    const res = await request(app)
      .get('/api/cms/sliders/all')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should get public sliders (active only)', async () => {
    const res = await request(app).get('/api/cms/sliders');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should update a slider', async () => {
    const res = await request(app)
      .put(`/api/cms/sliders/${sliderId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ title: 'Updated Slider', subtitle: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Slider');
  });

  it('should reorder sliders', async () => {
    const second = await request(app)
      .post('/api/cms/sliders')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildSlider({ title: 'Second Slider', displayOrder: 1 }));
    const secondId = second.body.data._id;

    const res = await request(app)
      .put('/api/cms/sliders/reorder')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ items: [{ id: sliderId, displayOrder: 5 }, { id: secondId, displayOrder: 0 }] });
    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get('/api/cms/sliders/all')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    const first = getRes.body.data.find((s) => s._id === sliderId);
    expect(first.displayOrder).toBe(5);

    await Slider.findByIdAndDelete(secondId);
  });

  it('should delete a slider', async () => {
    const res = await request(app)
      .delete(`/api/cms/sliders/${sliderId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Slider deleted');
  });

  it('should return 404 for non-existent slider', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/cms/sliders/${fakeId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });
});

/* ---------- Slider Schedule ---------- */

describe('Slider schedule logic', () => {
  it('should not return future-dated slider to public', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const slider = await request(app)
      .post('/api/cms/sliders')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildSlider({ title: 'Future Slider', startDate: future.toISOString() }));

    const res = await request(app).get('/api/cms/sliders');
    const found = res.body.data.find((s) => s._id === slider.body.data._id);
    expect(found).toBeUndefined();

    await Slider.findByIdAndDelete(slider.body.data._id);
  });

  it('should not return expired slider to public', async () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);
    const slider = await request(app)
      .post('/api/cms/sliders')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildSlider({ title: 'Expired Slider', endDate: past.toISOString() }));

    const res = await request(app).get('/api/cms/sliders');
    const found = res.body.data.find((s) => s._id === slider.body.data._id);
    expect(found).toBeUndefined();

    await Slider.findByIdAndDelete(slider.body.data._id);
  });

  it('should return slider with no dates to public', async () => {
    const slider = await request(app)
      .post('/api/cms/sliders')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildSlider({ title: 'No Date Slider', startDate: null, endDate: null }));

    const res = await request(app).get('/api/cms/sliders');
    const found = res.body.data.find((s) => s._id === slider.body.data._id);
    expect(found).toBeDefined();

    await Slider.findByIdAndDelete(slider.body.data._id);
  });
});

/* ---------- Banner ---------- */

describe('Banner CRUD', () => {
  let bannerId;

  it('should create a banner', async () => {
    const res = await request(app)
      .post('/api/cms/banners')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildBanner());
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Banner');
    expect(res.body.data.position).toBe('top');
    bannerId = res.body.data._id;
  });

  it('should return 400 for invalid position', async () => {
    const res = await request(app)
      .post('/api/cms/banners')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send(buildBanner({ position: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('should get all banners (admin)', async () => {
    const res = await request(app)
      .get('/api/cms/banners/all')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should get public banners (active only)', async () => {
    const res = await request(app).get('/api/cms/banners');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should update a banner', async () => {
    const res = await request(app)
      .put(`/api/cms/banners/${bannerId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ title: 'Updated Banner', position: 'bottom' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Banner');
    expect(res.body.data.position).toBe('bottom');
  });

  it('should delete a banner', async () => {
    const res = await request(app)
      .delete(`/api/cms/banners/${bannerId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Banner deleted');
  });

  it('should return 404 for non-existent banner', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/cms/banners/${fakeId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(404);
  });
});

/* ---------- Featured Products ---------- */

describe('Featured Products', () => {
  let featuredId;

  it('should assign product to featured section', async () => {
    const res = await request(app)
      .post('/api/cms/featured-products')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, section: 'featured' });
    expect(res.status).toBe(201);
    expect(res.body.data.section).toBe('featured');
    expect(res.body.data.product._id).toBe(testProduct._id.toString());
    featuredId = res.body.data._id;
  });

  it('should allow same product in different sections', async () => {
    const res = await request(app)
      .post('/api/cms/featured-products')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, section: 'best_seller' });
    expect(res.status).toBe(201);
    expect(res.body.data.section).toBe('best_seller');

    await FeaturedProduct.findByIdAndDelete(res.body.data._id);
  });

  it('should return 409 for duplicate assignment in same section', async () => {
    const res = await request(app)
      .post('/api/cms/featured-products')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, section: 'featured' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_ASSIGNMENT');
  });

  it('should return featured products grouped by section (public)', async () => {
    const res = await request(app).get('/api/cms/featured-products');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('featured');
    expect(res.body.data).toHaveProperty('best_seller');
    expect(res.body.data).toHaveProperty('new_arrival');
    expect(res.body.data.featured.length).toBeGreaterThanOrEqual(1);
  });

  it('should remove product from section', async () => {
    const res = await request(app)
      .delete(`/api/cms/featured-products/${featuredId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);

    const getRes = await request(app).get('/api/cms/featured-products');
    const found = getRes.body.data.featured.find((fp) => fp._id === featuredId);
    expect(found).toBeUndefined();
  });

  it('should return 404 for non-existent featured assignment', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/cms/featured-products/${fakeId}`)
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(404);
  });
});

/* ---------- Auth + RBAC ---------- */

describe('Auth and RBAC', () => {
  it('should return 401 without token on admin endpoints', async () => {
    const res = await request(app).get('/api/cms/sliders/all');
    expect(res.status).toBe(401);
  });

  it('should return 403 for customer on admin endpoints', async () => {
    const res = await request(app)
      .get('/api/cms/sliders/all')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('should return 200 for ecommerce staff on admin endpoints', async () => {
    const res = await request(app)
      .get('/api/cms/sliders/all')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
  });

  it('should return 200 without token on public endpoints', async () => {
    const res = await request(app).get('/api/cms/sliders');
    expect(res.status).toBe(200);
  });
});
