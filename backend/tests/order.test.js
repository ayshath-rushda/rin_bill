import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Order from '../src/models/Order.js';
import OrderItem from '../src/models/OrderItem.js';
import Courier from '../src/models/Courier.js';
import Cart from '../src/models/Cart.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Address from '../src/models/Address.js';
import StockTransaction from '../src/models/StockTransaction.js';

jest.setTimeout(30000);

let adminToken;
let ecomToken;
let customerToken;
let customer2Token;
let product;
let address;
let customerUser;
let customer2User;
let ecomUser;

let productCounter = 0;

const buildProduct = (overrides = {}) => {
  productCounter++;
  const ts = Date.now();
  return {
    name: `OrderTest Product ${productCounter}`,
    code: `ORD-TEST-${ts}-${productCounter}`,
    sku: `ORD-SKU-${ts}-${productCounter}`,
    sellingPrice: 500,
    costPrice: 400,
    stock: 20,
    lowStockLimit: 5,
    description: 'Order test product',
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

  const userRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);
  const userId = userRes.body.data._id;

  let addr = await Address.findOne({ user: userId });
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
  expect(orderRes.status).toBe(201);
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
  const ecomRole = await Role.findOne({ name: 'ecommerce_staff' });
  if (!adminRole || !ecomRole) {
    throw new Error('Run seed first: roles not found');
  }

  adminToken = await registerOrLogin('admin@rinbill.com', 'Admin@123');
  ecomToken = await registerOrLogin('ecom@rinbill.com', 'password123');

  customerToken = await registerOrLogin('order-customer@test.com');
  customer2Token = await registerOrLogin('order-customer2@test.com');

  customerUser = await User.findOne({ email: 'order-customer@test.com' });
  customer2User = await User.findOne({ email: 'order-customer2@test.com' });
  ecomUser = await User.findOne({ email: 'ecom@rinbill.com' });

  const category = await Category.create({ name: `OrdCat-${Date.now()}`, isActive: true });
  product = await Product.create(buildProduct({ category: category._id }));

  address = await Address.create({
    user: customerUser._id,
    label: 'Home',
    line1: '123 Test St',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '9876543210',
    isDefault: true,
  });
});

afterAll(async () => {
  await StockTransaction.deleteMany({ reason: { $in: ['order_cancelled', 'order_returned'] } });
  await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
  await OrderItem.deleteMany({});
  await Cart.deleteMany({});
  await Courier.deleteMany({});
  await Address.deleteMany({});
  await Product.deleteMany({ code: { $regex: /^ORD-TEST-/ } });
  await Category.deleteMany({ name: { $regex: /^OrdCat-/ } });
  await User.deleteMany({ email: { $in: ['order-customer@test.com', 'order-customer2@test.com'] } });
  await mongoose.connection.close();
});

describe('T7.1 - Order list', () => {
  let order1, order2;

  beforeAll(async () => {
    await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
    await OrderItem.deleteMany({});
    await Cart.deleteMany({});
    order1 = await createTestOrder(customerToken, 2);
    order2 = await createTestOrder(customer2Token, 1);
  });

  it('admin should see all orders', async () => {
    const res = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
  });

  it('customer should see only own orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    const orders = res.body.data.data;
    expect(orders.length).toBe(1);
    expect(orders[0].user?.toString()).toBe(customerUser._id.toString());
  });

  it('should return pagination metadata', async () => {
    const res = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.meta.page).toBe(1);
    expect(res.body.data.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('should filter orders by status', async () => {
    const res = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'delivered' });
    expect(res.status).toBe(200);
    const orders = res.body.data.data;
    orders.forEach((o) => {
      expect(o.orderStatus).toBe('delivered');
    });
  });

  it('should filter orders by date range', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ dateFrom: today, dateTo: today });
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should block unauthenticated access', async () => {
    const res = await request(app).get('/api/orders/admin');
    expect(res.status).toBe(401);
  });

  it('should block customer from admin list', async () => {
    const res = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('T7.2 - Status transitions', () => {
  let order;

  beforeEach(async () => {
    await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
    await OrderItem.deleteMany({});
    await Cart.deleteMany({});
    order = await createTestOrder(customerToken, 3);
  });

  it('should transition new -> confirmed', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.data.orderStatus).toBe('confirmed');
  });

  it('should transition confirmed -> packing', async () => {
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'packing' });
    expect(res.status).toBe(200);
    expect(res.body.data.orderStatus).toBe('packing');
  });

  it('should reject invalid transition (new -> delivered)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('should restock inventory on cancel', async () => {
    const productId = product._id.toString();
    const before = await Product.findById(productId);

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.data.orderStatus).toBe('cancelled');

    const after = await Product.findById(productId);
    expect(after.stock).toBe(before.stock + 3);

    const tx = await StockTransaction.findOne({ reference: order.orderNumber, reason: 'order_cancelled' });
    expect(tx).toBeDefined();
    expect(tx.type).toBe('stock_in');
    expect(tx.quantity).toBe(3);
  });

  it('should restock inventory on return', async () => {
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'packing' });
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'dispatched' });
    await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    const productId = product._id.toString();
    const before = await Product.findById(productId);

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'returned' });
    expect(res.status).toBe(200);
    expect(res.body.data.orderStatus).toBe('returned');

    const after = await Product.findById(productId);
    expect(after.stock).toBe(before.stock + 3);
  });

  it('should reject status update without auth', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(401);
  });

  it('should reject status update from customer', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent order', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/orders/${fakeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });
});

describe('T7.3 - Courier assignment', () => {
  let order;

  beforeEach(async () => {
    await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
    await OrderItem.deleteMany({});
    await Cart.deleteMany({});
    await Courier.deleteMany({});
    order = await createTestOrder(customerToken, 1);
  });

  it('should assign courier to an order', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/courier`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courierName: 'Delhivery',
        trackingNumber: 'DEL123456',
        dispatchDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(),
      });
    expect(res.status).toBe(200);
    expect(res.body.data.courierName).toBe('Delhivery');
    expect(res.body.data.trackingNumber).toBe('DEL123456');
  });

  it('should update existing courier', async () => {
    await request(app)
      .patch(`/api/orders/${order._id}/courier`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courierName: 'Delhivery', trackingNumber: 'DEL123456' });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/courier`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courierName: 'BlueDart', trackingNumber: 'BLUE789' });
    expect(res.status).toBe(200);
    expect(res.body.data.courierName).toBe('BlueDart');
  });

  it('tracking endpoint should return courier info', async () => {
    await request(app)
      .patch(`/api/orders/${order._id}/courier`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courierName: 'Delhivery', trackingNumber: 'DEL123456' });

    const res = await request(app)
      .get(`/api/orders/${order._id}/tracking`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.orderNumber).toBeDefined();
    expect(res.body.data.orderStatus).toBe('new');
    expect(res.body.data.courier.courierName).toBe('Delhivery');
    expect(res.body.data.courier.trackingNumber).toBe('DEL123456');
  });

  it('should reject courier assign without auth', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/courier`)
      .send({ courierName: 'Test', trackingNumber: 'TST123' });
    expect(res.status).toBe(401);
  });

  it('should reject courier assign from customer', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/courier`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ courierName: 'Test', trackingNumber: 'TST123' });
    expect(res.status).toBe(403);
  });

  it('tracking should return null courier when not assigned', async () => {
    const res = await request(app)
      .get(`/api/orders/${order._id}/tracking`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.courier).toBeNull();
  });
});

describe('T7.4 - Full lifecycle', () => {
  let order;

  beforeEach(async () => {
    await Order.deleteMany({ orderNumber: { $regex: /^ORD-/ } });
    await OrderItem.deleteMany({});
    await Cart.deleteMany({});
    order = await createTestOrder(customerToken, 1);
  });

  const transition = async (status) => {
    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status });
    return res;
  };

  it('should follow new -> confirmed -> packing -> dispatched -> delivered', async () => {
    expect((await transition('confirmed')).body.data.orderStatus).toBe('confirmed');
    expect((await transition('packing')).body.data.orderStatus).toBe('packing');
    expect((await transition('dispatched')).body.data.orderStatus).toBe('dispatched');
    expect((await transition('delivered')).body.data.orderStatus).toBe('delivered');
  });

  it('should reject backward transitions from delivered', async () => {
    await transition('confirmed');
    await transition('packing');
    await transition('dispatched');
    await transition('delivered');

    const res = await transition('packing');
    expect(res.status).toBe(409);
  });

  it('should reject transitions from cancelled', async () => {
    await transition('cancelled');
    const res = await transition('confirmed');
    expect(res.status).toBe(409);
  });

  it('should reject transitions from returned', async () => {
    await transition('confirmed');
    await transition('packing');
    await transition('dispatched');
    await transition('delivered');
    await transition('returned');

    const res = await transition('dispatched');
    expect(res.status).toBe(409);
  });
});
