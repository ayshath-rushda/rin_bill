# RINBILL — Error Handling & API Standards

---

## API Response Envelope

Every API response follows a consistent envelope:

### Success Response

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "Product A",
    "sellingPrice": 100
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

- `data` contains the response payload (object, array, or null)
- `meta` included for paginated endpoints only
- `message` is optional, omitted on simple GET requests

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is required" },
      { "field": "password", "message": "Password must be at least 8 characters" }
    ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed Joi validation |
| `UNAUTHORIZED` | 401 | Missing or expired JWT |
| `FORBIDDEN` | 403 | Valid token but insufficient role/permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate value (email, code, SKU) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INSUFFICIENT_STOCK` | 409 | Not enough inventory |
| `INVALID_STATUS_TRANSITION` | 409 | Order status change not allowed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `GST_DISABLED` | 404 | GST module not enabled |
| `FILE_TOO_LARGE` | 413 | Upload exceeds size limit |
| `INVALID_FILE_TYPE` | 415 | Unsupported file format |

---

## HTTP Status Code Map

| Method | Success | Created | No Content | Error |
|---|---|---|---|---|
| GET / | 200 | — | — | 400, 401, 403 |
| GET /:id | 200 | — | — | 401, 403, 404 |
| POST / | — | 201 | — | 400, 401, 403, 409 |
| PUT /:id | 200 | — | — | 400, 401, 403, 404, 409 |
| PATCH /:id | 200 | — | — | 400, 401, 403, 404 |
| DELETE /:id | — | — | 204 | 401, 403, 404, 409 |

---

## Global Error Handler (Backend)

```javascript
// middleware/errorHandler.js
export default function errorHandler(err, req, res, next) {
  // Log full error server-side
  console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `${field} already exists`
      }
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid ${err.path}: ${err.value}`
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token expired' }
    });
  }

  // Default
  return res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message
    }
  });
}
```

---

## Custom Error Classes

```javascript
// utils/AppError.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage
throw new AppError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
```

---

## Input Validation (Joi)

```javascript
// validators/product.validator.js
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  code: Joi.string().alphanum().min(3).max(20).required(),
  sku: Joi.string().min(3).max(50).required(),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  brand: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  sellingPrice: Joi.number().min(0).required(),
  costPrice: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).default(0),
  lowStockLimit: Joi.number().integer().min(0).default(5),
  description: Joi.string().max(5000).allow(''),
  shortDescription: Joi.string().max(500).allow(''),
  weight: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'draft').default('active'),
  vehicleCompatibility: Joi.array().items(Joi.string()).optional(),
  hsnCode: Joi.string().when('$gstEnabled', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  gstRate: Joi.number().valid(0, 5, 12, 18, 28).when('$gstEnabled', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
});

export const updateProductSchema = createProductSchema.fork(
  ['name', 'code', 'sku', 'category', 'brand', 'sellingPrice'],
  (schema) => schema.optional()
);
```

---

## API Versioning

- Current version: `v1` (prefix: `/api/v1/`)
- Maintain backward compatibility for 2 versions
- Version via `Accept` header or URL prefix

---

## Frontend Error Handling

### Axios Response Interceptor

```javascript
// api/axios.js
import axios from 'axios';
import { store } from '../store';
import { logout, refreshToken } from '../features/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data, // unwrap envelope
  async (error) => {
    const originalRequest = error.config;

    // Token expired — attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await store.dispatch(refreshToken()).unwrap();
        const newToken = store.getState().auth.accessToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        store.dispatch(logout());
        window.location.href = '/account/login';
        return Promise.reject(error);
      }
    }

    // Normalize error
    const err = {
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      message: error.response?.data?.error?.message || error.message,
      details: error.response?.data?.error?.details || [],
      status: error.response?.status,
    };

    return Promise.reject(err);
  }
);

export default api;
```

### React Query Global Error Handling

```javascript
// In QueryClientProvider wrapper
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (error.code === 'UNAUTHORIZED') {
          store.dispatch(logout());
          navigate('/account/login');
        }
        toast.error(error.message);
      },
    },
    mutations: {
      onError: (error) => {
        if (error.details?.length) {
          error.details.forEach(d => toast.error(`${d.field}: ${d.message}`));
        } else {
          toast.error(error.message);
        }
      },
    },
  },
});
```

### React Error Boundary

```javascript
// components/ErrorBoundary.jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary:', error, info);
    // Send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2>Something went wrong</h2>
          <p className="text-muted-foreground">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## Pagination Standard

### Request

| Query Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 100) |
| `sort` | string | `-createdAt` | Sort field with `-` prefix for desc |
| `search` | string | — | Text search query |

### Response (meta)

```json
"meta": {
  "page": 1,
  "limit": 10,
  "total": 42,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### Backend Helper

```javascript
// utils/paginate.js
export async function paginate(Model, query = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    populate = '',
    select = '',
  } = options;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select)
      .lean(),
    Model.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}
```

---

## Logging Standards

| Log Level | Color | When |
|---|---|---|
| `error` | Red | Unexpected errors, exceptions caught by error handler |
| `warn` | Yellow | Deprecated API usage, rate limit warnings |
| `info` | Blue | Server start, DB connection, route registration |
| `debug` | Gray | Development only — request/response bodies |
| `http` | Green | Morgan HTTP request logging |

Use `morgan` for HTTP logging in dev mode, and a structured logger (`winston` or `pino`) for production.
