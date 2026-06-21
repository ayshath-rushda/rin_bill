import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Product from '../src/models/Product.js';
import StockTransaction from '../src/models/StockTransaction.js';

jest.setTimeout(30000);

let superAdminToken;
let ecomStaffToken;
let billingStaffToken;
let customerToken;
let testProduct;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill_test');

  const adminRole = await Role.findOne({ name: 'super_admin' });
  const ecomRole = await Role.findOne({ name: 'ecommerce_staff' });
  const billingRole = await Role.findOne({ name: 'billing_staff' });
  const customerRole = await Role.findOne({ name: 'customer' });

  if (adminRole && ecomRole && billingRole && customerRole) {
    const adminUser = await User.findOne({ email: 'admin@rinbill.com' });
    if (adminUser) {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@rinbill.com', password: 'Admin@123' });
      superAdminToken = loginRes.body.data.accessToken;
    }

    const ecomUser = await User.findOne({ email: 'ecom-staff@test.com' });
    if (!ecomUser) {
      const ecomReg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ecom Staff',
          email: 'ecom-staff@test.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      await User.findByIdAndUpdate(ecomReg.body.data.user._id, { role: ecomRole._id, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ecom-staff@test.com', password: 'password123' });
      ecomStaffToken = loginRes.body.data.accessToken;
    } else {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ecom-staff@test.com', password: 'password123' });
      ecomStaffToken = loginRes.body.data.accessToken;
    }

    const billingUser = await User.findOne({ email: 'billing-staff@test.com' });
    if (!billingUser) {
      const billingReg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Billing Staff',
          email: 'billing-staff@test.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      await User.findByIdAndUpdate(billingReg.body.data.user._id, { role: billingRole._id, isVerified: true });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'billing-staff@test.com', password: 'password123' });
      billingStaffToken = loginRes.body.data.accessToken;
    } else {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'billing-staff@test.com', password: 'password123' });
      billingStaffToken = loginRes.body.data.accessToken;
    }

    const customerUser = await User.findOne({ email: 'inventory-customer@test.com' });
    if (!customerUser) {
      const custReg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Inventory Customer',
          email: 'inventory-customer@test.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      customerToken = custReg.body.data.accessToken;
    } else {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inventory-customer@test.com', password: 'password123' });
      customerToken = loginRes.body.data.accessToken;
    }
  }

  testProduct = await Product.create({
    name: 'Inventory Test Product',
    code: 'INV-TEST-001',
    sku: 'INV-TEST-SKU-001',
    sellingPrice: 100,
    stock: 10,
    lowStockLimit: 3,
    status: 'active',
  });
});

afterAll(async () => {
  await Product.deleteMany({ code: /^INV-TEST/ });
  if (testProduct) {
    await StockTransaction.deleteMany({ product: testProduct._id });
  }
  await User.deleteMany({ email: { $in: ['ecom-staff@test.com', 'billing-staff@test.com', 'inventory-customer@test.com'] } });
  await mongoose.connection.close();
});

describe('POST /api/inventory/stock-in', () => {
  it('should increase stock and log transaction', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-in')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, quantity: 5, reason: 'Restock' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.stock).toBe(15);

    const tx = await StockTransaction.findOne({ product: testProduct._id, type: 'stock_in' }).sort({ createdAt: -1 });
    expect(tx).toBeTruthy();
    expect(tx.quantity).toBe(5);
    expect(tx.previousStock).toBe(10);
    expect(tx.newStock).toBe(15);
  });

  it('should return 400 for missing quantity', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-in')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, reason: 'Restock' });
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/inventory/stock-in')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: fakeId, quantity: 1, reason: 'Test' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/inventory/stock-out', () => {
  it('should decrease stock and log transaction', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, quantity: 3, reason: 'damaged' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.stock).toBe(12);

    const tx = await StockTransaction.findOne({ product: testProduct._id, type: 'stock_out' }).sort({ createdAt: -1 });
    expect(tx).toBeTruthy();
    expect(tx.quantity).toBe(3);
    expect(tx.reason).toBe('damaged');
  });

  it('should return 409 for insufficient stock', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, quantity: 999, reason: 'damaged' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('should return 400 for invalid reason', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-out')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, quantity: 1, reason: 'invalid_reason' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/inventory/adjust', () => {
  it('should set exact quantity for Super Admin', async () => {
    const res = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ productId: testProduct._id, quantity: 20, reason: 'Inventory count correction' });
    expect(res.status).toBe(200);
    expect(res.body.data.product.stock).toBe(20);
    expect(res.body.data.previousStock).toBe(12);
    expect(res.body.data.newStock).toBe(20);
  });

  it('should return 403 for non-super-admin', async () => {
    const res = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${ecomStaffToken}`)
      .send({ productId: testProduct._id, quantity: 25, reason: 'Attempted adjust' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/inventory', () => {
  it('should return paginated stock overview', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.meta).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/inventory/low-stock', () => {
  it('should return products below lowStockLimit', async () => {
    await Product.create({
      name: 'Low Stock Test',
      code: 'INV-TEST-LOW',
      sku: 'LOW-SKU',
      sellingPrice: 50,
      stock: 1,
      lowStockLimit: 5,
      status: 'active',
    });
    const res = await request(app)
      .get('/api/inventory/low-stock')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((p) => p.stock <= p.lowStockLimit)).toBe(true);

    await Product.deleteMany({ code: 'INV-TEST-LOW' });
  });
});

describe('GET /api/inventory/history', () => {
  it('should return paginated transaction history', async () => {
    const res = await request(app)
      .get('/api/inventory/history')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.meta).toBeDefined();
  });

  it('should filter by type', async () => {
    const res = await request(app)
      .get('/api/inventory/history?type=stock_in')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
    res.body.data.data.forEach((tx) => {
      expect(tx.type).toBe('stock_in');
    });
  });

  it('should filter by date range', async () => {
    const res = await request(app)
      .get('/api/inventory/history?dateFrom=2020-01-01&dateTo=2030-01-01')
      .set('Authorization', `Bearer ${ecomStaffToken}`);
    expect(res.status).toBe(200);
  });
});

describe('RBAC and Auth', () => {
  it('should return 403 for billing staff on stock-in', async () => {
    const res = await request(app)
      .post('/api/inventory/stock-in')
      .set('Authorization', `Bearer ${billingStaffToken}`)
      .send({ productId: testProduct._id, quantity: 1, reason: 'Test' });
    expect(res.status).toBe(403);
  });

  it('should return 403 for customer on inventory read', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/inventory/history');
    expect(res.status).toBe(401);
  });
});
