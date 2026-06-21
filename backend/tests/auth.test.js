import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';

let superAdminToken;
let customerToken;
let refreshTokenValue;
let testOtp;
let testUserId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill_test');

  const adminRole = await Role.findOne({ name: 'super_admin' });
  const customerRole = await Role.findOne({ name: 'customer' });

  if (adminRole && customerRole) {
    const adminUser = await User.findOne({ email: 'admin@rinbill.com' });
    if (adminUser) {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@rinbill.com', password: 'Admin@123' });
      superAdminToken = loginRes.body.data.accessToken;
    }
  }
});

afterAll(async () => {
  await User.deleteMany({ email: { $regex: /test.*@test\.com$/ } });
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  const testUser = {
    name: 'Test User',
    email: 'test-user@test.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    testUserId = res.body.data.user._id;
    refreshTokenValue = res.body.data.refreshToken;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  it('should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak',
        email: 'weak@test.com',
        password: '123',
        confirmPassword: '123',
      });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-user@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    customerToken = res.body.data.accessToken;
    refreshTokenValue = res.body.data.refreshToken;
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-user@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('should refresh access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshTokenValue });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should send OTP (always returns success)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test-user@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return success even for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/me', () => {
  it('should get current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test-user@test.com');
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/rate limiting', () => {
  it('should rate limit auth endpoint', async () => {
    const promises = Array(6)
      .fill()
      .map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'pass' })
      );
    const results = await Promise.all(promises);
    const rateLimited = results.some((r) => r.status === 429);
    expect(rateLimited).toBe(true);
  });
});
