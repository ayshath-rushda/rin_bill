# RINBILL — Security & State Management

---

## Security Architecture

### Authentication Flow

```
┌────────────┐         ┌──────────────┐         ┌──────────┐
│   Login    │ ──────► │  Server      │ ──────► │  Return  │
│  Request   │         │  Verify Creds│         │  Tokens  │
└────────────┘         └──────────────┘         └────┬─────┘
                                                     │
                                          ┌──────────┴──────────┐
                                          │ Access Token (15m)   │
                                          │ → stored in memory   │
                                          │ Refresh Token (7d)   │
                                          │ → httpOnly cookie    │
                                          └─────────────────────┘
```

### Token Strategy

| Token | Duration | Storage | Usage |
|---|---|---|---|
| Access Token | 15 minutes | Redux store (memory) | `Authorization: Bearer <token>` header |
| Refresh Token | 7 days | httpOnly cookie | `POST /api/auth/refresh` |

### Axios Interceptor Flow

```
Request
  │
  ├── Attach Authorization header if access token exists
  │
  └── Response interceptor:
       ├── 200: return response
       └── 401:
            ├── Attempt refresh (POST /auth/refresh)
            │   ├── Success → retry original request with new token
            │   └── Fail → logout, redirect to login
            └── Not a 401 → reject
```

### Middleware Pipeline

```
Request
  │
  ▼
Rate Limiter (express-rate-limit)
  │  General: 100 requests / 15 min
  │  Auth:      5 requests / 1 min
  │  API:      60 requests / 1 min
  ▼
CORS (configured origins)
  │
  ▼
Helmet (security headers)
  │
  ▼
Morgan (request logging)
  │
  ▼
Route Match
  │
  ├── Public route → Controller
  └── Protected route:
       │
       ▼
     Auth Middleware (JWT verify)
       │
       ├── Invalid/expired → 401
       └── Valid →
              │
              ▼
            RBAC Middleware (check role)
              │
              ├── Unauthorized role → 403
              └── Authorized →
                     │
                     ▼
                   Validate Middleware (Joi)
                     │
                     ├── Invalid → 400 + errors
                     └── Valid →
                            │
                            ▼
                          Controller
                            │
                            ├── Read → response
                            └── CUD →
                                   │
                                   ▼
                                 Audit Log Middleware
                                   │
                                   ▼
                                 Response
```

### Security Checklist

- [ ] JWT with strong secret (≥256 bits, environment variable)
- [ ] Refresh tokens stored hashed in DB (bcrypt)
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] httpOnly + Secure + SameSite=Strict cookies for refresh tokens
- [ ] All inputs validated server-side with Joi
- [ ] MongoDB injection prevention (mongoose sanitization, mongo-sanitize)
- [ ] Helmet security headers
- [ ] CORS whitelist (only allow frontend origin)
- [ ] Rate limiting per IP
- [ ] CSRF protection (double-submit cookie pattern)
- [ ] File upload validation (type, size limit: 5MB)
- [ ] Cloudinary signed URLs for uploads
- [ ] No sensitive data in error responses (use generic messages)
- [ ] Audit logging for all CUD operations
- [ ] Environment variables via `.env` (never commit)
- [ ] .env / .env.local in .gitignore

### Audit Logging

Every Create / Update / Delete operation logs to `activityLogs`:

```json
{
  "user": "ObjectId",
  "action": "create | update | delete",
  "resource": "product | order | user | etc.",
  "resourceId": "ObjectId",
  "details": {
    "changedFields": { "field": "oldValue → newValue" }
  },
  "ip": "req.ip",
  "userAgent": "req.headers['user-agent']"
}
```

### GST Security

- GST routes are NEVER registered in Express when `gstEnabled === false`
- GST controllers check the flag again as a safety net
- Frontend GST routes have no sidebar link; only accessible via direct URL
- `GstRoute` component checks `gstEnabled` AND Super Admin role before rendering
- If a non-Super Admin accesses `/admin/system/gst/*` → redirect to `/admin`

---

## State Management Strategy

### Division: Redux Toolkit vs React Query

| Concern | Tool | Why |
|---|---|---|
| **Auth state** (user, tokens) | Redux | Persistent, needed globally across app |
| **Cart** (items, quantities) | Redux | Client-side, needs instant updates |
| **UI state** (sidebar open, theme, modals) | Redux | Local UI concerns |
| **Settings** (feature flags) | Redux | Loaded once on app start, cached |
| **Products** (list, detail) | React Query | Server data, needs caching + refetch |
| **Categories, Brands** | React Query | Server data, rarely changes |
| **Orders** | React Query | Server data, pagination, status updates |
| **Reports / Dashboard** | React Query | Server data, auto-refetch |
| **CMS** (sliders, banners) | React Query | Server data, cache invalidation on edit |
| **Inventory** | React Query | Server data, real-time stock |

### Redux Store Structure

```javascript
// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import cartReducer from './features/cartSlice';
import uiReducer from './features/uiSlice';
import settingsReducer from './features/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
    settings: settingsReducer,
  },
});
```

### authSlice

```javascript
// State shape
{
  user: { id, name, email, role, permissions, avatar } | null,
  accessToken: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
}

// Actions/Thunks
- login(credentials) → thunk
- register(data) → thunk
- logout() → action
- refreshToken() → thunk
- updateProfile(data) → thunk
```

### cartSlice

```javascript
// State shape
{
  items: [{ product, quantity, savedForLater }],
  isLoading: boolean,
}

// Actions/Thunks
- fetchCart() → thunk
- addItem({ productId, quantity }) → thunk
- updateQuantity({ productId, quantity }) → thunk
- removeItem(productId) → thunk
- toggleSaveForLater(productId) → thunk
- clearCart() → action
```

### uiSlice

```javascript
// State shape
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark',
  activeModal: string | null,
  toasts: [],
}
```

### settingsSlice

```javascript
// State shape
{
  gstEnabled: boolean,
  multiWarehouse: boolean,
  multiBranch: boolean,
  purchaseManagement: boolean,
  isLoading: boolean,
}
```

### React Query Setup

```javascript
// QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min
      cacheTime: 30 * 60 * 1000,       // 30 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Key React Query Patterns

```javascript
// Product list with pagination + filters
useQuery(['products', { page, limit, search, category, sortBy }],
  () => productApi.getAll({ page, limit, search, category, sortBy }),
  { keepPreviousData: true }
);

// Single product
useQuery(['product', slug], () => productApi.getBySlug(slug));

// Mutations with cache invalidation
const createProduct = useMutation(productApi.create, {
  onSuccess: () => queryClient.invalidateQueries(['products']),
});

// Dashboard auto-refresh
useQuery(['dashboard'], dashboardApi.get, {
  refetchInterval: 5 * 60 * 1000, // every 5 min
});
```
