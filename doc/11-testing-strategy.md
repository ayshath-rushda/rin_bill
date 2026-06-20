# RINBILL — Testing Strategy

---

## Testing Pyramid

```
        ╱─────╲
       ╱  E2E  ╲         ← 5%  (Cypress / Playwright)
      ╱─────────╲
     ╱     API    ╲       ← 25% (Supertest + Jest)
    ╱───────────────╲
   ╱    Unit Tests    ╲   ← 30% (Jest — services, utils, validators)
  ╱─────────────────────╲
 ╱  Component / Hook Test ╲ ← 40% (React Testing Library)
╱───────────────────────────╲
```

---

## Directory Structure

```
backend/
├── tests/
│   ├── setup.js                  # DB setup, env, global before/after
│   ├── helpers/
│   │   ├── factory.js            # Test data factories
│   │   ├── authHelper.js         # Login helper, token generation
│   │   └── dbHelper.js           # Clean DB, seed test data
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth.service.test.js
│   │   │   ├── product.service.test.js
│   │   │   └── order.service.test.js
│   │   └── utils/
│   │       ├── paginate.test.js
│   │       ├── formatters.test.js
│   │       └── gst.test.js
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── products.test.js
│   │   ├── orders.test.js
│   │   ├── inventory.test.js
│   │   ├── billing.test.js
│   │   ├── cms.test.js
│   │   ├── reports.test.js
│   │   ├── gst.test.js
│   │   └── dashboard.test.js
│   └── fixtures/
│       ├── users.js
│       ├── products.js
│       ├── categories.js
│       ├── orders.js
│       └── settings.js
│
frontend/
├── src/
│   └── __tests__/
│       ├── components/
│       │   ├── DataTable.test.jsx
│       │   ├── StatusBadge.test.jsx
│       │   ├── FileUpload.test.jsx
│       │   └── ConfirmDialog.test.jsx
│       ├── hooks/
│       │   ├── useAuth.test.js
│       │   ├── useCart.test.js
│       │   └── useDebounce.test.js
│       ├── features/
│       │   ├── authSlice.test.js
│       │   ├── cartSlice.test.js
│       │   └── settingsSlice.test.js
│       ├── pages/
│       │   ├── LoginPage.test.jsx
│       │   ├── ProductDetail.test.jsx
│       │   └── Checkout.test.jsx
│       └── utils/
│           ├── formatters.test.js
│           └── validators.test.js
```

---

## Backend Test Patterns

### Setup (`tests/setup.js`)

```javascript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**Note:** Use `mongodb-memory-server` for CI; for local dev, a dedicated test DB is faster.

### Test Data Factories (`tests/helpers/factory.js`)

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const createUser = async (overrides = {}) => {
  const User = mongoose.model('User');
  const password = overrides.password || 'Password123!';
  const hashed = await bcrypt.hash(password, 10);
  return User.create({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: hashed,
    role: overrides.role || new mongoose.Types.ObjectId(),
    isVerified: true,
    ...overrides,
  });
};

export const createProduct = async (overrides = {}) => {
  const Product = mongoose.model('Product');
  return Product.create({
    name: 'Test Product',
    code: `P${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    category: overrides.category || new mongoose.Types.ObjectId(),
    brand: overrides.brand || new mongoose.Types.ObjectId(),
    sellingPrice: 100,
    costPrice: 60,
    stock: 50,
    lowStockLimit: 5,
    status: 'active',
    ...overrides,
  });
};

export const createOrder = async (overrides = {}) => {
  const Order = mongoose.model('Order');
  return Order.create({
    orderNumber: `ORD-${Date.now()}`,
    customer: overrides.customer || new mongoose.Types.ObjectId(),
    subtotal: 200,
    total: 200,
    status: 'new',
    paymentMethod: 'cash',
    ...overrides,
  });
};
```

### Auth Helper (`tests/helpers/authHelper.js`)

```javascript
import jwt from 'jsonwebtoken';
import { createUser } from './factory.js';

export const loginAs = async (role, overrides = {}) => {
  const user = await createUser({ role, ...overrides });
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  return { user, accessToken };
};

export const getAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});
```

### Integration Test Example (`tests/integration/products.test.js`)

```javascript
import request from 'supertest';
import app from '../../src/app.js';
import { createUser, createProduct, createCategory } from '../helpers/factory.js';
import { loginAs, getAuthHeader } from '../helpers/authHelper.js';

describe('Products API', () => {
  let staffToken, adminToken, category;

  beforeAll(async () => {
    category = await createCategory({ name: 'Test Cat' });
    const staff = await loginAs('ecommerce_staff');
    staffToken = staff.accessToken;

    const admin = await loginAs('super_admin');
    adminToken = admin.accessToken;
  });

  describe('POST /api/products', () => {
    it('should create a product when authenticated as ecommerce staff', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(getAuthHeader(staffToken))
        .send({
          name: 'New Product',
          code: 'NP001',
          sku: 'SKU-NP001',
          category: category._id,
          brand: category._id, // simplified
          sellingPrice: 200,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Product');
    });

    it('should reject when not authenticated', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Bad' });

      expect(res.status).toBe(401);
    });

    it('should reject when billing staff tries to create', async () => {
      const billing = await loginAs('billing_staff');
      const res = await request(app)
        .post('/api/products')
        .set(getAuthHeader(billing.accessToken))
        .send({
          name: 'Should Fail',
          code: 'FAIL01',
          sku: 'SKU-FAIL01',
          category: category._id,
          brand: category._id,
          sellingPrice: 100,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/products', () => {
    it('should list products with pagination', async () => {
      await createProduct({ category: category._id });
      await createProduct({ category: category._id });

      const res = await request(app).get('/api/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should search products by name', async () => {
      await createProduct({ name: 'Brake Pad Set', category: category._id });
      await createProduct({ name: 'Oil Filter', category: category._id });

      const res = await request(app).get('/api/products?search=brake');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toContain('Brake');
    });
  });
});
```

---

## What to Test Per Module

| Module | Unit Tests | Integration Tests | Key Scenarios |
|---|---|---|---|
| **Auth** | Password hashing, token generation, OTP generation | Register, login, refresh, forgot password, RBAC | Duplicate email, wrong password, expired token, invalid role |
| **Products** | Validation schemas, price calculation | CRUD, search, filter, pagination, image upload | Duplicate SKU, invalid category, missing required fields |
| **Inventory** | Stock calculation logic | Stock in/out/adjust, history, low stock alerts | Negative stock (should fail), concurrent transactions |
| **Orders** | Status transition validation, totals calculation | Create order, status update, courier assignment | Invalid status transition, out-of-stock order |
| **Billing** | Invoice number generation, GST computation | Invoice creation, payment recording | B2B credit limit exceeded, partial payment |
| **CMS** | Slider scheduling logic | Slider/banner CRUD, reorder | Schedule overlap, missing image |
| **Reports** | Aggregation pipeline output shape | Sales report by period, export formats | Empty date range, large dataset performance |
| **GST** | GST computation (CGST/SGST/IGST) | HSN CRUD, GST reports, feature flag | GST routes 404 when disabled |

---

## Frontend Testing Patterns

### Component Test Example

```javascript
// __tests__/components/DataTable.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DataTable from '../../components/DataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Price' },
];

const data = [
  { _id: '1', name: 'Product A', price: 100 },
  { _id: '2', name: 'Product B', price: 200 },
];

test('renders table with data', () => {
  render(
    <BrowserRouter>
      <DataTable columns={columns} data={data} />
    </BrowserRouter>
  );

  expect(screen.getByText('Product A')).toBeInTheDocument();
  expect(screen.getByText('Product B')).toBeInTheDocument();
});

test('calls onRowClick when row is clicked', () => {
  const onRowClick = jest.fn();
  render(
    <BrowserRouter>
      <DataTable columns={columns} data={data} onRowClick={onRowClick} />
    </BrowserRouter>
  );

  fireEvent.click(screen.getByText('Product A'));
  expect(onRowClick).toHaveBeenCalledWith(data[0]);
});
```

### Hook Test Example

```javascript
// __tests__/hooks/useDebounce.test.js
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../../hooks/useDebounce';

test('debounces value by specified delay', async () => {
  jest.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 500),
    { initialProps: { value: 'hello' } }
  );

  expect(result.current).toBe('hello');

  rerender({ value: 'hello world' });
  expect(result.current).toBe('hello'); // not yet updated

  act(() => { jest.advanceTimersByTime(500); });
  expect(result.current).toBe('hello world');

  jest.useRealTimers();
});
```

### Redux Slice Test Example

```javascript
// __tests__/features/cartSlice.test.js
import cartReducer, { addItem, removeItem, updateQuantity } from '../../features/cartSlice';

const initialState = { items: [], isLoading: false };

test('adds item to cart', () => {
  const item = { product: { _id: '1', name: 'Test', sellingPrice: 100 }, quantity: 1 };
  const state = cartReducer(initialState, addItem(item));
  expect(state.items).toHaveLength(1);
  expect(state.items[0].quantity).toBe(1);
});

test('increments quantity when same product added', () => {
  const item = { product: { _id: '1', name: 'Test', sellingPrice: 100 }, quantity: 1 };
  let state = cartReducer(initialState, addItem(item));
  state = cartReducer(state, addItem(item));
  expect(state.items).toHaveLength(1);
  expect(state.items[0].quantity).toBe(2);
});

test('removes item from cart', () => {
  let state = cartReducer(initialState, addItem({ product: { _id: '1' }, quantity: 1 }));
  state = cartReducer(state, removeItem('1'));
  expect(state.items).toHaveLength(0);
});
```

---

## E2E Testing (Cypress / Playwright)

### Scope

| Flow | Description |
|---|---|
| **Customer purchase flow** | Browse products → add to cart → checkout → place order → view order confirmation |
| **Admin order processing** | Login → view orders → update status → assign courier |
| **POS billing flow** | Login as billing staff → search product → add items → complete payment → print invoice |
| **GST enable flow** | Login as Super Admin → enable GST → verify GST fields appear → create GST invoice |

### E2E Test Structure

```
frontend/cypress/
├── e2e/
│   ├── auth.cy.js
│   ├── product-browse.cy.js
│   ├── checkout.cy.js
│   ├── admin-orders.cy.js
│   ├── pos-billing.cy.js
│   └── gst-module.cy.js
├── fixtures/
│   └── test-data.json
├── support/
│   ├── commands.js
│   └── e2e.js
└── cypress.config.js
```

---

## Jest Configuration

### Backend `jest.config.js`

```javascript
export default {
  testEnvironment: 'node',
  setupFilesAfterSetup: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
};
```

### Frontend `jest.config.js` (Vitest recommended for Vite)

```javascript
// vite.config.js — Vitest config
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/**/*.test.*'],
    },
  },
});
```

---

## Mocking Strategy

| Scenario | Tool | Notes |
|---|---|---|
| External API (Cloudinary) | `nock` or `msw` | Mock upload responses |
| Email sending | `nodemailer-mock` | Capture sent emails in memory |
| Database | `mongodb-memory-server` | In-memory MongoDB for tests |
| Date/time | `jest.useFakeTimers` | For scheduling, OTP expiry, reports |
| File upload (frontend) | Mock `FormData` + `File` constructor | Test without actual file |
| Router (frontend) | Wrap in `MemoryRouter` | Control navigation in tests |
| Redux store | `configureStore` with test state | Test connected components |

---

## CI Test Execution Order

```
1. Lint (ESLint)
2. Type check (if TypeScript)
3. Unit tests (fastest first)
4. Integration tests
5. Build (frontend + backend)
6. E2E tests (slowest)
```
