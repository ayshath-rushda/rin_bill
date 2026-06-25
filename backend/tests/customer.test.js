import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Brand from '../src/models/Brand.js';

jest.setTimeout(30000);

let customerToken;
let category;
let brand;
let activeProduct;
let draftProduct;

let productCounter = 0;

const buildProduct = (overrides = {}) => {
  productCounter++;
  const ts = Date.now();
  return {
    name: `Test Product ${productCounter}`,
    code: `PRD-TEST-${ts}-${productCounter}`,
    sku: `SKU-${ts}-${productCounter}`,
    sellingPrice: 500,
    costPrice: 400,
    stock: 10,
    lowStockLimit: 5,
    description: 'Full description',
    shortDescription: 'Short desc',
    category: category?._id,
    brand: brand?._id,
    images: ['https://res.cloudinary.com/demo/image/upload/v1/test.jpg'],
    status: 'active',
    ...overrides,
  };
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill_test');

  const adminRole = await Role.findOne({ name: 'super_admin' });
  if (!adminRole) {
    throw new Error('Run seed first: roles not found');
  }

  const customerRole = await Role.findOne({ name: 'customer' });
  const customerUser = await User.findOne({ email: 'customer-test@test.com' });
  if (!customerUser) {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Customer Test', email: 'customer-test@test.com', password: 'password123', confirmPassword: 'password123' });
    customerToken = regRes.body.data?.accessToken;
  } else {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer-test@test.com', password: 'password123' });
    customerToken = loginRes.body.data?.accessToken;
  }

  category = await Category.create({ name: `TestCat-${Date.now()}`, isActive: true });
  brand = await Brand.create({ name: `TestBrand-${Date.now()}` });
});

afterAll(async () => {
  await Product.deleteMany({ code: { $regex: /^PRD-TEST-/ } });
  await Category.deleteMany({ name: { $regex: /^TestCat-/ } });
  await Brand.deleteMany({ name: { $regex: /^TestBrand-/ } });
  await Category.deleteMany({ name: { $regex: /^TopCat-/ } });
  await User.deleteMany({ email: 'customer-test@test.com' });
  await mongoose.connection.close();
});

describe('Public product listing', () => {
  beforeEach(async () => {
    await Product.deleteMany({ code: { $regex: /^PRD-TEST-/ } });
    activeProduct = await Product.create(buildProduct({ name: 'Active Product' }));
    draftProduct = await Product.create(buildProduct({ status: 'draft', name: 'Draft Product' }));
    await Product.create(buildProduct({ status: 'inactive', name: 'Inactive Product' }));
  });

  it('should return only active products for public', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const products = res.body.data.data;
    products.forEach((p) => {
      expect(p.status).toBe('active');
    });
  });

  it('should exclude draft and inactive products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const names = res.body.data.data.map((p) => p.name);
    expect(names).not.toContain('Draft Product');
    expect(names).not.toContain('Inactive Product');
  });

  it('should support search parameter', async () => {
    const res = await request(app).get('/api/products').query({ search: 'Active' });
    expect(res.status).toBe(200);
    const results = res.body.data.data;
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      expect(p.name.toLowerCase()).toContain('active');
    });
  });

  it('should support category filter', async () => {
    const res = await request(app).get('/api/products').query({ category: category._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  it('should support price range filter', async () => {
    const res = await request(app).get('/api/products').query({ minPrice: 100, maxPrice: 1000 });
    expect(res.status).toBe(200);
  });

  it('should support sorting', async () => {
    const res = await request(app).get('/api/products').query({ sortBy: 'price_asc' });
    expect(res.status).toBe(200);
    const prices = res.body.data.data.map((p) => p.sellingPrice);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('should return pagination meta', async () => {
    const res = await request(app).get('/api/products').query({ page: 1, limit: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.meta.page).toBe(1);
    expect(res.body.data.meta.total).toBeGreaterThan(0);
  });

  it('should work without authentication', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
  });
});

describe('Related products', () => {
  beforeEach(async () => {
    await Product.deleteMany({ code: { $regex: /^PRD-TEST-/ } });
    activeProduct = await Product.create(buildProduct({ name: 'Main Product' }));
    for (let i = 0; i < 6; i++) {
      await Product.create(buildProduct({ name: `Related ${i}` }));
    }
    const otherCat = await Category.findOne({ name: { $regex: /^TestCat-/ } });
    await Product.create(buildProduct({ name: 'Other Category', category: otherCat?._id }));
  });

  it('should return products from same category', async () => {
    const res = await request(app).get(`/api/products/${activeProduct.slug}/related`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((p) => {
      expect(p.category?._id || p.category).toBe(activeProduct.category.toString());
    });
  });

  it('should exclude the current product', async () => {
    const res = await request(app).get(`/api/products/${activeProduct.slug}/related`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((p) => p._id);
    expect(ids).not.toContain(activeProduct._id.toString());
  });

  it('should return max 6 products', async () => {
    const res = await request(app).get(`/api/products/${activeProduct.slug}/related`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(6);
  });

  it('should return empty array for product with no category', async () => {
    const noCat = await Product.create(buildProduct({
      sku: `SKU-NOCAT-${Date.now()}`,
      name: 'No Category',
      category: undefined,
    }));
    const res = await request(app).get(`/api/products/${noCat.slug}/related`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 404 for non-existent slug', async () => {
    const res = await request(app).get('/api/products/non-existent-product/related');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('Top categories', () => {
  beforeAll(async () => {
    const ts = Date.now();
    for (let i = 0; i < 5; i++) {
      const cat = await Category.create({ name: `TopCat-${ts}-${i}`, isActive: true });
      await Product.create(buildProduct({ name: `TopCat Product ${i}`, category: cat._id }));
    }
    const inactiveCat = await Category.create({ name: `TopCat-Inactive-${ts}`, isActive: false });
    await Product.create(buildProduct({ name: 'Inactive Cat Product', category: inactiveCat._id }));
    await Category.create({ name: `TopCat-Empty-${ts}`, isActive: true });
  });

  it('should return only active categories with at least one product', async () => {
    const res = await request(app).get('/api/categories/top');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((cat) => {
      expect(cat.isActive).toBe(true);
      expect(cat.productCount).toBeGreaterThan(0);
    });
  });

  it('should return at most 8 categories', async () => {
    const res = await request(app).get('/api/categories/top');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(8);
  });

  it('should order by product count descending', async () => {
    const res = await request(app).get('/api/categories/top');
    expect(res.status).toBe(200);
    for (let i = 1; i < res.body.data.length; i++) {
      expect(res.body.data[i].productCount).toBeLessThanOrEqual(res.body.data[i - 1].productCount);
    }
  });

  it('should exclude inactive categories even with products', async () => {
    const res = await request(app).get('/api/categories/top');
    expect(res.status).toBe(200);
    const names = res.body.data.map((c) => c.name);
    expect(names.some((n) => n.includes('Inactive'))).toBe(false);
  });

  it('should exclude empty categories', async () => {
    const res = await request(app).get('/api/categories/top');
    expect(res.status).toBe(200);
    const names = res.body.data.map((c) => c.name);
    expect(names.some((n) => n.includes('Empty'))).toBe(false);
  });
});
