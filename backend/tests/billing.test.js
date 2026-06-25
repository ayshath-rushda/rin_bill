import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Invoice from '../src/models/Invoice.js';
import Payment from '../src/models/Payment.js';
import StockTransaction from '../src/models/StockTransaction.js';

jest.setTimeout(30000);

let billingToken;
let product;

const registerOrLogin = async (email, password = 'password123') => {
  const exists = await User.findOne({ email });
  if (exists) {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data?.accessToken;
  }
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: email.split('@')[0], email, password, confirmPassword: password });
  return res.body.data?.accessToken;
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill_test');

  const billingRole = await Role.findOne({ name: 'billing_staff' });
  if (!billingRole) throw new Error('Run seed first: billing_staff role not found');

  billingToken = await registerOrLogin('billing@rinbill.com', 'password123');

  const category = await Category.create({ name: `BillCat-${Date.now()}`, isActive: true });
  product = await Product.create({
    name: 'Billing Test Product',
    code: `BILL-TEST-${Date.now()}`,
    sku: `BILL-SKU-${Date.now()}`,
    sellingPrice: 1000,
    costPrice: 700,
    stock: 50,
    lowStockLimit: 5,
    description: 'Billing test product',
    shortDescription: 'Short',
    images: ['https://res.cloudinary.com/demo/image/upload/v1/test.jpg'],
    status: 'active',
    category: category._id,
    hsnCode: '847130',
    gstRate: 18,
  });
});

afterAll(async () => {
  await Invoice.deleteMany({ invoiceNumber: { $regex: /^INV-/ } });
  await Payment.deleteMany({});
  await StockTransaction.deleteMany({ reason: 'pos_sale' });
  await Product.deleteMany({ code: { $regex: /^BILL-TEST-/ } });
  await Category.deleteMany({ name: { $regex: /^BillCat-/ } });
  await mongoose.connection.close();
});

describe('T8.1 - Invoice creation', () => {
  it('should create an invoice with correct totals', async () => {
    const res = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 2 }],
        paymentMethod: 'cash',
        amountPaid: 2360,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-/);
    expect(res.body.data.subtotal).toBe(2000);
    expect(res.body.data.total).toBe(2360);
    expect(res.body.data.paymentStatus).toBe('completed');
  });

  it('should generate correct invoice number format', async () => {
    const res = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 1 }],
        paymentMethod: 'upi',
        amountPaid: 1000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{8}-\d{5}$/);
  });

  it('should decrement stock on invoice creation', async () => {
    const before = await Product.findById(product._id);
    const qty = 3;

    await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: qty }],
        paymentMethod: 'cash',
        amountPaid: 3000,
      });

    const after = await Product.findById(product._id);
    expect(after.stock).toBe(before.stock - qty);
  });

  it('should reject insufficient stock', async () => {
    const res = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 9999 }],
        paymentMethod: 'cash',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('should reject without auth', async () => {
    const res = await request(app)
      .post('/api/billing/invoices')
      .send({ items: [{ productId: product._id.toString(), quantity: 1 }], paymentMethod: 'cash' });
    expect(res.status).toBe(401);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({ paymentMethod: 'cash' });
    expect(res.status).toBe(400);
  });
});

describe('T8.2 - Product search', () => {
  it('should search by code prefix', async () => {
    const prefix = product.code.slice(0, 6);
    const res = await request(app)
      .get(`/api/billing/search/product?q=${prefix}`)
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].code).toBe(product.code);
  });

  it('should search by name', async () => {
    const res = await request(app)
      .get('/api/billing/search/product?q=Billing')
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return empty array for no match', async () => {
    const res = await request(app)
      .get('/api/billing/search/product?q=ZZZZNOMATCH')
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return max 20 results', async () => {
    const res = await request(app)
      .get('/api/billing/search/product?q=BILL')
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(20);
  });
});

describe('T8.3 - Payment recording', () => {
  let invoice;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 2 }],
        paymentMethod: 'cash',
        amountPaid: 500,
      });
    invoice = res.body.data;
  });

  it('should record full payment', async () => {
    const remaining = invoice.total - invoice.amountPaid;
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        invoiceId: invoice._id,
        amount: remaining,
        method: 'upi',
      });

    expect(res.status).toBe(201);
    const updated = await Invoice.findById(invoice._id).lean();
    expect(updated.paymentStatus).toBe('completed');
    expect(updated.amountPaid).toBe(invoice.total);
  });

  it('should record partial payment', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        invoiceId: invoice._id,
        amount: 300,
        method: 'cash',
      });

    expect(res.status).toBe(201);
    const updated = await Invoice.findById(invoice._id).lean();
    expect(updated.paymentStatus).toBe('partial');
  });

  it('should reject overpayment', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        invoiceId: invoice._id,
        amount: 99999,
        method: 'cash',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OVERPAYMENT');
  });

  it('should list payments', async () => {
    await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({ invoiceId: invoice._id, amount: 200, method: 'cash' });

    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });
});

describe('T8.4 - Invoice listing and detail', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({ items: [{ productId: product._id.toString(), quantity: 1 }], paymentMethod: 'cash' });
  });

  it('should list invoices', async () => {
    const res = await request(app)
      .get('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
    expect(res.body.data.meta).toBeDefined();
  });

  it('should filter invoices by type', async () => {
    const res = await request(app)
      .get('/api/billing/invoices?type=retail')
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    res.body.data.data.forEach((inv) => {
      expect(inv.type).toBe('retail');
    });
  });

  it('should get invoice detail', async () => {
    const list = await request(app)
      .get('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`);
    const invId = list.body.data.data[0]._id;

    const res = await request(app)
      .get(`/api/billing/invoices/${invId}`)
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('should return print-friendly data', async () => {
    const list = await request(app)
      .get('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`);
    const invId = list.body.data.data[0]._id;

    const res = await request(app)
      .get(`/api/billing/invoices/${invId}/print`)
      .set('Authorization', `Bearer ${billingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._printFriendly).toBe(true);
  });
});

describe('T8.5 - Invoice number', () => {
  it('should generate sequential numbers per day', async () => {
    const r1 = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({ items: [{ productId: product._id.toString(), quantity: 1 }], paymentMethod: 'cash' });
    const r2 = await request(app)
      .post('/api/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({ items: [{ productId: product._id.toString(), quantity: 1 }], paymentMethod: 'cash' });

    const n1 = parseInt(r1.body.data.invoiceNumber.split('-')[2], 10);
    const n2 = parseInt(r2.body.data.invoiceNumber.split('-')[2], 10);
    expect(n2).toBe(n1 + 1);
  });
});
