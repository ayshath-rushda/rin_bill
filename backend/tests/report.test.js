import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Order from '../src/models/Order.js';
import OrderItem from '../src/models/OrderItem.js';
import Cart from '../src/models/Cart.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Address from '../src/models/Address.js';

jest.setTimeout(30000);

let adminToken;
let customerToken;
let product;
let customerUser;
let productCounter = 0;

const buildProduct = (overrides = {}) => {
  productCounter++;
  const ts = Date.now();
  return {
    name: `ReportTest Product ${productCounter}`,
    code: `REP-TEST-${ts}-${productCounter}`,
    sku: `REP-SKU-${ts}-${productCounter}`,
    sellingPrice: 500,
    costPrice: 400,
    stock: 20,
    lowStockLimit: 5,
    description: 'Report test product',
    shortDescription: 'Short',
    images: ['https://res.cloudinary.com/demo/image/upload/v1/test.jpg'],
    status: 'active',
    ...overrides,
  };
};

const ensureStock = async (minStock = 30) => {
  const fresh = await Product.findById(product._id);
  if (fresh.stock < minStock) {
    fresh.stock = minStock;
    await fresh.save();
  }
  return fresh;
};

const createTestOrder = async (token, qty = 2) => {
  const prod = await ensureStock(qty);
  const cartRes = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: prod._id.toString(), quantity: qty });
  expect(cartRes.status).toBe(200);

  let addr = await Address.findOne({ user: customerUser._id });
  if (!addr) {
    const addrRes = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        label: 'Home',
        line1: '123 Test St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '9876543210',
        isDefault: true,
      });
    addr = addrRes.body.data;
  }

  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ addressId: addr._id.toString(), paymentMethod: 'cash' });
  if (orderRes.status !== 201) return null;
  return orderRes.body.data;
};

const registerOrLogin = async (email, password = 'password123') => {
  const exists = await User.findOne({ email });
  if (exists) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    return res.body.data?.accessToken;
  }
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: email.split('@')[0], email, password, confirmPassword: password });
  return res.body.data?.accessToken;
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill_test');

  const adminRole = await Role.findOne({ name: 'super_admin' });
  if (!adminRole) {
    throw new Error('Run seed first: roles not found');
  }

  adminToken = await registerOrLogin('admin@rinbill.com', 'Admin@123');
  customerToken = await registerOrLogin('report-customer@test.com');

  customerUser = await User.findOne({ email: 'report-customer@test.com' });

  const category = await Category.create({ name: `RepCat-${Date.now()}`, isActive: true });
  product = await Product.create(buildProduct({ category: category._id }));
});

afterAll(async () => {
  await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
  await OrderItem.deleteMany({});
  await Cart.deleteMany({});
  await Address.deleteMany({});
  await Product.deleteMany({ code: { $regex: /^REP-TEST-/ } });
  await Category.deleteMany({ name: { $regex: /^RepCat-/ } });
  await User.deleteMany({ email: { $in: ['report-customer@test.com'] } });
  await mongoose.connection.close();
});

describe('T9.1 - Sales report', () => {
  beforeAll(async () => {
    await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
    await OrderItem.deleteMany({});
    await Cart.deleteMany({});
    await createTestOrder(customerToken, 1);
    await createTestOrder(customerToken, 2);
  });

  it('should return sales grouped by period', async () => {
    const res = await request(app)
      .get('/api/reports/sales?period=daily')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.totalOrders).toBeGreaterThanOrEqual(2);
    expect(res.body.data.summary.totalRevenue).toBeGreaterThan(0);
  });

  it('should return empty array for future date range', async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    const res = await request(app)
      .get(`/api/reports/sales?dateFrom=${future.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.records).toEqual([]);
    expect(res.body.data.summary.totalOrders).toBe(0);
  });

  it('should reject invalid period', async () => {
    const res = await request(app)
      .get('/api/reports/sales?period=invalid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('should reject without auth', async () => {
    const res = await request(app).get('/api/reports/sales');
    expect(res.status).toBe(401);
  });
});

describe('T9.2 - Top customers report', () => {
  it('should return top customers ordered by spend', async () => {
    const res = await request(app)
      .get('/api/reports/customers/top?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('totalSpend');
    }
  });

  it('should respect limit param', async () => {
    const res = await request(app)
      .get('/api/reports/customers/top?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });
});

describe('T9.3 - Export Excel', () => {
  beforeAll(async () => {
    await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
    await OrderItem.deleteMany({});
    await Cart.deleteMany({});
    await createTestOrder(customerToken, 1);
  });

  it('should generate Excel file', async () => {
    const res = await request(app)
      .get('/api/reports/export/sales?format=excel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml/);
    expect(res.headers['content-disposition']).toMatch(/\.xlsx/);
    expect(res.body).toBeTruthy();
  });

  it('should reject invalid format', async () => {
    const res = await request(app)
      .get('/api/reports/export/sales?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});

describe('T9.4 - Export PDF', () => {
  it('should generate PDF file', async () => {
    const res = await request(app)
      .get('/api/reports/export/sales?format=pdf')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
    expect(res.body).toBeTruthy();
  });
});
