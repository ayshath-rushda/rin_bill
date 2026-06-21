# RINBILL — Phase-by-Phase Development Plan

> Each phase contains numbered tasks for implementation + testing (backend & frontend).

---

## Phase 1: Authentication & Role-Based Access Control

**Duration:** 3–5 days  
**Goal:** User registration, login, JWT auth, role/permission system.

> All tasks are flat-numbered (1, 2, 3...) in strict dependency order. Complete each before starting the next.

---

### Backend Tasks

**✅ 1. Initialize backend project**
- Files: `backend/package.json`, `backend/.env.example`, `backend/.env`, `backend/.eslintrc.cjs`, `backend/.prettierrc`, `backend/.gitignore`
- Run `npm init`, install deps: express, mongoose, bcryptjs, jsonwebtoken, joi, helmet, cors, morgan, express-rate-limit, dotenv, cookie-parser
- Create folder structure: `src/config/`, `src/models/`, `src/middleware/`, `src/routes/`, `src/controllers/`, `src/validators/`, `src/services/`, `seeds/`
- **Done when:** `npm run dev` starts with no errors

**✅ 2. Create environment configuration**
- File: `backend/src/config/env.js`
- Load `.env` with dotenv, export validated config object: `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES` (15m), `JWT_REFRESH_EXPIRES` (7d), `FRONTEND_URL`, `NODE_ENV`
- **Done when:** Config exports correct values from env

**✅ 3. Set up MongoDB connection**
- File: `backend/src/config/db.js`
- Connect mongoose with retry logic, log connection success/failure events, handle graceful shutdown
- **Done when:** Server logs "MongoDB connected" on startup

**✅ 4. Create global error handler middleware**
- File: `backend/src/middleware/errorHandler.js`
- Handle: Mongoose ValidationError, duplicate key (code 11000), CastError, JWT errors (JsonWebTokenError, TokenExpiredError), generic AppError class
- Return consistent JSON shape: `{ success: false, error: { code, message, details? } }`
- **Done when:** Invalid ObjectId returns 404, duplicate email returns 409, missing body field returns 400

**✅ 5. Create rate limiter middleware**
- File: `backend/src/middleware/rateLimiter.js`
- Auth limiter: 5 requests per minute on `/api/auth/*`
- General limiter: 100 requests per 15 minutes on all other routes
- **Done when:** 6 rapid auth requests return 429

**✅ 6. Apply security middleware**
- File: `backend/src/app.js`
- Apply `helmet()`, `cors({ origin: FRONTEND_URL, credentials: true })`, `morgan('dev')`, `cookieParser()`, JSON body parser (limit 10mb)
- **Done when:** Server responds with security headers, CORS allows frontend origin

**✅ 7. Create Role model**
- File: `backend/src/models/Role.js`
- Fields: `name` (String, unique, enum), `permissions` ([String]), `description` (String)
- Timestamps: true
- **Done when:** Role schema validates, can create/query roles

**✅ 8. Create User model**
- File: `backend/src/models/User.js`
- Fields: `name`, `email` (unique, lowercase), `password`, `role` (ObjectId ref Role), `phone`, `avatar`, `isActive` (default true), `isVerified` (default false), `refreshToken`, `resetPasswordOTP`, `resetPasswordExpires`
- Pre-save hook: hash password with bcrypt (12 rounds) only if modified
- Instance method: `comparePassword(candidatePassword)` → boolean
- Indexes: `email` (unique), `role`
- **Done when:** Password auto-hashes on create, comparePassword works, duplicate email throws

**✅ 9. Create auth JWT middleware**
- File: `backend/src/middleware/auth.js`
- Extract token from `Authorization: Bearer <token>` header
- Verify with `JWT_ACCESS_SECRET`, decode payload `{ id, role }`
- Find user by id, attach `req.user` with populated role + permissions
- Throw 401 if: no token, invalid token, expired token, user not found, user inactive
- **Done when:** Valid token attaches user, invalid token returns 401

**✅ 10. Create RBAC middleware**
- File: `backend/src/middleware/rbac.js`
- Accepts variadic permission strings: `rbac('product.create', 'product.update')`
- Super admin (`*`) bypasses all checks
- Support wildcard pattern: `resource.*` matches any action on resource
- Throw 403 with `FORBIDDEN` code if none match
- **Done when:** Super admin passes any check; billing staff blocked on `product.create`

**✅ 11. Create Joi auth validators**
- File: `backend/src/validators/auth.validator.js`
- Schemas: `registerSchema` (name, email, password min 6, confirmPassword), `loginSchema` (email, password), `forgotPasswordSchema` (email), `verifyOtpSchema` (email, otp), `resetPasswordSchema` (email, otp, password, confirmPassword), `updateProfileSchema` (name, phone, avatar)
- Export wrapped middleware: `validate(schema)` that validates `req.body`
- **Done when:** Missing fields return 400 with field-level details

**✅ 12. Build POST /api/auth/register**
- Files: `backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js`
- Validate body → check email uniqueness → create user with `customer` role → generate access token (15m) + refresh token (7d) → return user (no password) + tokens
- **Done when:** Valid registration creates user and returns tokens

**✅ 13. Build POST /api/auth/login**
- Same controller file
- Find user by email → compare password → check isActive → generate tokens → set refresh token as httpOnly cookie → return user + access token
- Rate limited via auth limiter
- **Done when:** Correct credentials return tokens; wrong password returns 401

**✅ 14. Build POST /api/auth/refresh**
- Same controller file
- Accept refresh token from body or cookie → verify with `JWT_REFRESH_SECRET` → find user, compare stored hash → issue new access token
- Rotate refresh token (issue new one, invalidate old)
- **Done when:** Valid refresh token returns new access token; expired returns 401

**✅ 15. Build POST /api/auth/forgot-password**
- Same controller file
- Find user by email → generate 6-digit OTP → hash + store OTP with 10min expiry → send email (or log in dev) → return success (always, even if email not found — security)
- **Done when:** OTP is stored hashed on user doc, email sent

**✅ 16. Build POST /api/auth/verify-otp**
- Same controller file
- Find user by email → compare OTP (hash comparison) → check expiry → mark `isVerified = true` → return success token
- **Done when:** Correct OTP within 10min verifies; expired/invalid returns 400

**✅ 17. Build POST /api/auth/reset-password**
- Same controller file
- Verify OTP again → hash new password → save → clear OTP fields → return success
- **Done when:** Password updated, old password no longer works

**✅ 18. Build GET/PUT /api/auth/me**
- Same controller file (protected routes)
- `GET`: Return `req.user` with populated role + permissions (strip password, refreshToken)
- `PUT`: Validate body (name, phone, avatar), update fields, return updated user
- Also add `PUT /api/auth/me/password` for changing password while logged in (requires oldPassword)
- **Done when:** Authenticated user can view and update profile

**✅ 19. Wire up Express app**
- File: `backend/src/app.js`
- Import and apply: security middleware, rate limiters, routes (`/api/auth`), error handler (last)
- Create `backend/src/server.js`: import app, connect DB, listen on PORT, handle unhandled rejections
- **Done when:** Server starts, `/api/auth/register` responds

**✅ 20. Create seed script**
- File: `backend/seeds/index.js`
- Seed 4 default roles: `super_admin` (permissions: `['*']`), `billing_staff` (billing.*, customer.read, etc.), `ecommerce_staff` (product.*, inventory.*, etc.), `customer` (product.read, order.*, invoice.read)
- Seed super admin user: email `admin@rinbill.com`, password `Admin@123`, role `super_admin`
- Seed default settings: `{ key: 'gstEnabled', value: false }`, `{ key: 'multiWarehouse', value: false }`
- Run via `node seeds/index.js`
- **Done when:** Running seed populates DB with roles + admin user + settings

**✅ 21. Backend integration tests**
- File: `backend/tests/auth.test.js`
- Test register: success, duplicate email, weak password, missing fields
- Test login: success, wrong password, inactive user, non-existent email
- Test refresh: success, expired token, invalid token
- Test forgot/reset: OTP generation, OTP expiry, correct reset, reuse blocked
- Test auth middleware: missing token → 401, expired token → 401, malformed → 401
- Test RBAC: super admin = pass all, billing staff blocked on product.create
- Test rate limiting: 6 rapid auth requests → 429
- Test error handler: CastError → 404, duplicate key → 409, validation → 400
- **Done when:** `npm test` passes all 8 test groups

---

### Frontend Tasks

**✅ 22. Initialize Vite + React project**
- Run: `npm create vite@latest frontend -- --template react` in `backend/` parent (or manually create `frontend/`)
- Install: tailwindcss, postcss, autoprefixer, react-router-dom, @reduxjs/toolkit, react-redux, @tanstack/react-query, axios, lucide-react, react-hot-toast
- Run `npx tailwindcss init -p`, configure `content` paths
- Create basic `frontend/vite.config.js` with path alias `@/` → `src/`
- **Done when:** `npm run dev` shows default Vite page

**✅ 23. Configure shadcn UI**
- Run `npx shadcn-ui@latest init` with defaults
- Add components: button, input, card, form, dialog, toast, label, separator, avatar, dropdown-menu, sheet, skeleton, badge
- Update `frontend/components.json` if needed
- **Done when:** A shadcn `<Button>` renders correctly on page

**✅ 24. Set up Redux store**
- File: `frontend/src/app/store.js`
- `configureStore({ reducer: { auth: authReducer, ui: uiReducer } })`
- Wrap `<App />` with `<Provider store={store}>` in `main.jsx`
- **Done when:** Redux DevTools show store initialized

**✅ 25. Set up React Query**
- File: `frontend/src/main.jsx`
- Create `QueryClient` with `defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } }`
- Wrap app with `<QueryClientProvider client={queryClient}>`
- **Done when:** React Query DevTools available (dev mode)

**✅ 26. Create Axios instance**
- File: `frontend/src/api/axios.js`
- Base URL from `import.meta.env.VITE_API_URL` (default `http://localhost:5000/api`)
- Request interceptor: attach `Authorization: Bearer <token>` from Redux store
- Response interceptor: on 401, attempt token refresh via `/api/auth/refresh`, retry original request; if refresh fails, dispatch `logout()`
- Unwrap response envelope: `response.data.data` → return data directly
- **Done when:** Authenticated requests include Bearer token; expired token auto-refreshes

**✅ 27. Create authSlice**
- File: `frontend/src/features/auth/authSlice.js`
- Initial state: `{ user: null, accessToken: null, isAuthenticated: false, isLoading: false }`
- Async thunks using `createAsyncThunk`: `login`, `register`, `refreshToken`, `logout`, `updateProfile`
- Reducers: `setCredentials`, `clearCredentials`, `setUser`
- Extra reducers handle all thunk states (pending/fulfilled/rejected)
- **Done when:** Dispatching `login` thunk sets user + token in state

**✅ 28. Create uiSlice**
- File: `frontend/src/features/ui/uiSlice.js`
- State: `{ sidebarOpen: true, theme: 'light' }`
- Reducers: `toggleSidebar`, `setTheme`
- **Done when:** Sidebar state toggles

**✅ 29. Create AuthLayout**
- File: `frontend/src/layouts/AuthLayout.jsx`
- Centered card layout on gradient background
- Renders logo + `<Outlet />` for auth pages (login, register, forgot-password)
- Responsive: full-screen on mobile, card max-w-md on desktop
- **Done when:** Auth pages display centered with consistent styling

**✅ 30. Create AdminLayout**
- File: `frontend/src/layouts/AdminLayout.jsx`
- Sidebar (collapsible via sheet on mobile, fixed on desktop): logo, role-based nav groups, no GST links
- Header: search bar (placeholder), notification bell, user menu dropdown (profile, logout)
- Main content area: `<Outlet />`
- Nav groups conditionally rendered based on user permissions
- **Done when:** Admin sees sidebar matching their role; billing staff can't see Products nav

**✅ 31. Create CustomerLayout**
- File: `frontend/src/layouts/CustomerLayout.jsx`
- Header: logo, main nav (Home, Products), search bar, cart icon (badge count, placeholder), user menu
- Footer: links, contact info, social icons (placeholder)
- Main content: `<Outlet />`
- Mobile: hamburger menu, slide-out nav
- **Done when:** Customer layout renders with nav links

**✅ 32. Create ProtectedRoute**
- File: `frontend/src/routes/ProtectedRoute.jsx`
- Check `isAuthenticated` from Redux auth state
- If not authenticated, redirect to `/account/login` with `?redirect=` param
- If loading (token refresh in progress), show spinner/skeleton
- Otherwise render `<Outlet />`
- **Done when:** Unauthenticated user redirected to login

**✅ 33. Create AdminRoute**
- File: `frontend/src/routes/AdminRoute.jsx`
- Same as ProtectedRoute, but additionally check user role is staff (not customer)
- If unauthorized, redirect to `/admin` with error toast
- **Done when:** Customer trying to access `/admin` gets redirected

**✅ 34. Create LoginPage**
- File: `frontend/src/pages/customer/auth/LoginPage.jsx`
- Email + password form with validation (required fields, email format)
- Submit dispatches `login` thunk
- On success: redirect to `?redirect` param or `/` for customers, `/admin` for staff
- Error display from rejected thunk
- "Forgot password?" link, "Register" link
- **Done when:** Valid credentials log in and redirect; invalid shows error

**✅ 35. Create RegisterPage**
- File: `frontend/src/pages/customer/auth/RegisterPage.jsx`
- Name, email, password, confirm password form
- Client-side validation: password match, min length, valid email
- Submit dispatches `register` thunk
- On success: redirect to login page with success toast
- **Done when:** Registration creates account, redirects to login

**✅ 36. Create ForgotPasswordPage**
- File: `frontend/src/pages/customer/auth/ForgotPasswordPage.jsx`
- Multi-step: step 1 → email input (send OTP), step 2 → OTP input, step 3 → new password + confirm
- Each step validates then calls corresponding API
- On complete: redirect to login with success message
- Back/retry navigation between steps
- **Done when:** Full password reset flow works end-to-end

**✅ 37. Create ProfilePage**
- File: `frontend/src/pages/customer/account/ProfilePage.jsx`
- Display user info: name, email, phone, avatar
- Edit mode: inline fields, avatar upload (placeholder), save dispatches `updateProfile`
- **Done when:** User can view and update their profile

**✅ 38. Create AppRoutes**
- File: `frontend/src/routes/AppRoutes.jsx`
- Compose all route groups using `createBrowserRouter` or `<Routes>`:
  - Public: `/` (placeholder HomePage), `/account/login`, `/account/register`, `/account/forgot-password`
  - Customer protected (wrapped in CustomerLayout + ProtectedRoute): `/account/profile`
  - Admin protected (wrapped in AdminLayout + AdminRoute): `/admin` (placeholder dashboard)
- Lazy load page components with `React.lazy()` + `<Suspense>`
- Catch-all 404 page
- **Done when:** All routes render correct layout + guard combination

**✅ 39. Frontend component tests**
- File: `frontend/src/__tests__/LoginPage.test.jsx`, etc.
- Test LoginPage: renders form, validates empty fields, shows server error, navigates on success
- Test RegisterPage: validates password match, shows errors, redirects on success
- Test ProtectedRoute: redirects unauthenticated, renders children when authenticated
- Test AdminRoute: blocks customer, allows super admin
- Test authSlice: login sets user+token, logout clears, refresh updates
- Test Axios interceptor: attaches token, retries on 401, dispatches logout on refresh fail
- **Done when:** `npm test` passes all 6 test groups

---

## Phase 2: Product Management

**Duration:** 4–6 days  
**Goal:** Full CRUD for categories, brands, and products with images.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| ✅ 2.1 | Create `Category` model | `name`, `slug` (auto, unique), `image`, `description`, `isActive` |
| ✅ 2.2 | Create `Brand` model | `name`, `logo`, `description` |
| ✅ 2.3 | Create `Product` model | All fields per OVERVIEW.md: `name`, `code` (unique, auto-gen), `sku` (unique), `category` (ref), `brand` (ref), `vehicleCompatibility[]`, `description`, `shortDescription`, `images[]`, `galleryImages[]`, `sellingPrice`, `costPrice`, `stock`, `lowStockLimit`, `weight`, `status` (active/inactive/draft), `hsnCode`, `gstRate` |
| ✅ 2.4 | Configure Cloudinary | `config/cloudinary.js` — SDK + multer-storage-cloudinary. Folder routing by resource type |
| ✅ 2.5 | Build Category CRUD routes | `GET /api/categories` (public active), `GET /all` (admin), `POST`, `PUT /:id`, `DELETE /:id` |
| ✅ 2.6 | Build Brand CRUD routes | `GET /api/brands` (public), `POST`, `PUT /:id`, `DELETE /:id` |
| ✅ 2.7 | Build Product CRUD routes | `GET /api/products` (search, filter, sort, paginate), `GET /featured` (sections), `GET /:slug`, `POST`, `PUT /:id`, `DELETE /:id` (soft delete) |
| ✅ 2.8 | Build product image upload | `POST /api/products/:id/images` — accept array (max 10), upload to Cloudinary, store URLs |
| ✅ 2.9 | Build product image delete | `DELETE /api/products/:id/images/:imageId` — destroy on Cloudinary, remove URL from array |
| ✅ 2.10 | Build product listing query | Text search ($or with $regex), filter by category/brand/price range, sort (price_asc, price_desc, newest, name), offset pagination |
| ✅ 2.11 | Add Joi validators | `createProductSchema`, `updateProductSchema`, category schema, brand schema. Conditional GST fields based on gstEnabled context |
| ✅ 2.12 | Create pagination helper | `utils/paginate.js` — generic paginate(Model, query, options) returning `{ data, meta }` |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| ✅ T2.1 | Category CRUD | Create, update, delete, list active only, duplicate name slug, delete with products attached (block) |
| ✅ T2.2 | Brand CRUD | Same pattern as categories |
| ✅ T2.3 | Product create | All required fields, duplicate code/SKU, invalid category ref, missing sellingPrice |
| ✅ T2.4 | Product update | Partial update, changing category, clearing images |
| ✅ T2.5 | Product listing | Search by name/code/SKU, filter by category/brand/price, sort, pagination metadata |
| ✅ T2.6 | Product delete | Soft delete (status = inactive), re-activate |
| ✅ T2.7 | Image upload | Success, exceeds max count, invalid file type, file too large, no auth |
| ✅ T2.8 | Image delete | Success, invalid imageId, Cloudinary destroy error |
| ✅ T2.9 | Auth + RBAC | Public can only list active products, billing staff cannot create/edit |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| ✅ 2.13 | Create DataTable component | Reusable table: columns config, sortable headers, loading skeleton, empty state, row click |
| ✅ 2.14 | Create SearchInput component | Debounced input (400ms), clear button |
| ✅ 2.15 | Create Pagination component | Page numbers, prev/next, page size selector |
| ✅ 2.16 | Create ConfirmDialog component | Modal: title, message, confirm/cancel buttons, destructive variant |
| ✅ 2.17 | Create FileUpload component | Drag-and-drop zone, preview thumbnails, remove individual, upload progress |
| ✅ 2.18 | Create CategoryList page | DataTable + Create/Edit dialog (name, description, image upload, status toggle) |
| ✅ 2.19 | Create BrandList page | DataTable + Create/Edit dialog (name, description, logo upload) |
| ✅ 2.20 | Create ProductList page | DataTable with search, filter dropdowns (category, brand, status, price range), pagination, toolbar (new, export) |
| ✅ 2.21 | Create ProductForm page | Full form: name, code, SKU, category select (searchable), brand select, price fields, rich text description, short description, vehicle compatibility (tag input), image uploader, gallery uploader, stock fields, status, weight |
| ✅ 2.22 | Create product API module | `api/product.api.js` — getAll, getBySlug, create, update, delete, uploadImages, deleteImage |
| ✅ 2.23 | Create category API module | `api/category.api.js` — getAll, create, update, delete |
| ✅ 2.24 | Create brand API module | Same pattern |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| ✅ T2.10 | CategoryList | Renders table, opens create dialog, submits form, shows success toast |
| ✅ T2.11 | ProductForm | Validates required fields, shows validation errors, submits with FormData, handles upload progress |
| ✅ T2.12 | DataTable | Renders columns, shows loading skeleton, handles empty state, calls onRowClick |
| ✅ T2.13 | SearchInput | Debounces value, calls onChange after delay, clears input |
| ✅ T2.14 | Pagination | Renders page numbers, disables prev on page 1, calls onChange |
| ✅ T2.15 | FileUpload | Shows previews, removes on click, calls onUpload with FormData |

---

## Phase 3: Inventory Management

**Duration:** 3–4 days  
**Goal:** Stock tracking, in/out/adjust, history, low-stock alerts.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 3.1 | Create `Inventory` model | `product` (unique ref), `quantity` |
| 3.2 | Create `StockTransaction` model | `product` (ref), `type` (in/out/adjustment), `quantity`, `previousStock`, `newStock`, `reason`, `reference` (order no.), `user` (ref) |
| 3.3 | Build `POST /api/inventory/stock-in` | Find/create inventory, increment quantity, log transaction with reason |
| 3.4 | Build `POST /api/inventory/stock-out` | Check sufficient stock, decrement, log transaction (reason: damaged, expired, etc.) |
| 3.5 | Build `POST /api/inventory/adjust` | Set exact quantity (Super Admin only), log with reason |
| 3.6 | Build `GET /api/inventory` | Stock overview with product details (populated) |
| 3.7 | Build `GET /api/inventory/history` | Paginated transactions, filterable by product/type/date range |
| 3.8 | Build `GET /api/inventory/low-stock` | Products where `stock <= lowStockLimit`, ordered by stock ascending |
| 3.9 | Auto-create inventory on product creation | Post-save hook on Product model, or in product controller after create |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T3.1 | Stock in | Correct increment, transaction log created, product stock field updated |
| T3.2 | Stock out | Correct decrement, insufficient stock → 409, negative quantity rejected |
| T3.3 | Stock adjust | Exact quantity set, logged, only Super Admin can execute |
| T3.4 | Stock history | Paginated, filterable, correct transaction type |
| T3.5 | Low stock | Returns only products below threshold, sorted ascending |
| T3.6 | Concurrent transactions | Two simultaneous stock-out requests don't cause negative stock |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 3.10 | Create InventoryPage | Stock overview table: product name/code, current stock, lowStockLimit, status badge (ok/low/out) |
| 3.11 | Create StockInForm (modal) | Product select (searchable), quantity input, reason text field |
| 3.12 | Create StockOutForm (modal) | Same pattern, reason dropdown (damaged, expired, stolen, other) |
| 3.13 | Create StockAdjustForm (modal) | Exact quantity input, reason required, visible only to Super Admin |
| 3.14 | Create InventoryHistory page | DataTable: product, type badge (color-coded), quantity (+green/-red), previous → new, reason, user, date |
| 3.15 | Create LowStockAlerts widget | Dashboard card with count + link to filter, color-coded severity |
| 3.16 | Create inventory API module | `api/inventory.api.js` — getStock, stockIn, stockOut, adjust, getHistory, getLowStock |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T3.7 | StockInForm | Submits with valid data, shows error on missing quantity, success toast |
| T3.8 | InventoryHistory | Renders transactions, filter by type works, pagination |
| T3.9 | StockAdjustForm | Only visible to Super Admin, requires reason, updates table after submit |

---

## Phase 4: Homepage CMS

**Duration:** 2–3 days  
**Goal:** Admin-managed homepage content — sliders, banners, featured products.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 4.1 | Create `Slider` model | `title`, `subtitle`, `description`, `buttonText`, `buttonUrl`, `bannerImage`, `displayOrder`, `isActive`, `startDate`, `endDate` |
| 4.2 | Create `Banner` model | `title`, `image`, `url`, `position` (top/middle/bottom), `isActive` |
| 4.3 | Create `FeaturedProduct` model | `product` (ref), `section` (featured/best_seller/new_arrival), `displayOrder` |
| 4.4 | Build Slider CRUD routes | `GET /api/cms/sliders` (public: active + in schedule), `GET /all` (admin), `POST`, `PUT /:id`, `DELETE /:id` |
| 4.5 | Build `PUT /api/cms/sliders/reorder` | Accept `[{ id, displayOrder }]`, bulk update order |
| 4.6 | Build Banner CRUD routes | Same pattern (no reorder needed) |
| 4.7 | Build FeaturedProduct routes | `GET /api/cms/featured-products` (grouped by section), `POST` (assign product to section), `DELETE` (remove) |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T4.1 | Slider CRUD | Create, update with schedule, only active+in-schedule returned to public, reorder |
| T4.2 | Banner CRUD | Same pattern |
| T4.3 | Featured products | Assign product, same product in multiple sections, remove, public returns grouped |
| T4.4 | Schedule logic | Future startDate not returned, past endDate not returned, no dates = always shown |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 4.8 | Create SliderManager page | Sortable list (drag-and-drop), create/edit dialog with all fields, image upload, active toggle, schedule date pickers |
| 4.9 | Create BannerManager page | CRUD with position selector, image upload |
| 4.10 | Create FeaturedManager page | Searchable product selector per section (featured/best-seller/new-arrival), current assignments displayed, remove button |
| 4.11 | Create cms API module | `api/cms.api.js` — all slider/banner/featured endpoints |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T4.5 | SliderManager | Reorder persists, create dialog validates image, schedule date restricts past dates |
| T4.6 | FeaturedManager | Product search filters correctly, assign then shows in list, remove calls delete API |

---

## Phase 5: Customer Website

**Duration:** 4–5 days  
**Goal:** Public-facing e-commerce site with dynamic content.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 5.1 | Ensure public endpoints return CMS data | `GET /api/cms/sliders` (active), `GET /api/products/featured` (grouped), `GET /api/categories` (active only) — verify all return correct data |
| 5.2 | Ensure product listing returns correct public data | Only `status: 'active'` products, correct pagination meta, populated category/brand names |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T5.1 | Public product listing | Only active products returned, inactive/draft excluded |
| T5.2 | Public CMS endpoints | Only active sliders returned, scheduled correctly |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 5.3 | Create HomePage | Hero slider (auto-play, dots, arrows), featured products row, top categories grid, new arrivals section, best sellers section, promotional banners. All sections load from API |
| 5.4 | Create ProductListing page | Grid/list view toggle, sidebar filters (category checkboxes, brand checkboxes, price range slider), search bar, sort dropdown, pagination |
| 5.5 | Create ProductDetail page | Image gallery (main + thumbnails), product info (name, price, description, specs), vehicle compatibility tags, add to cart button with qty selector, related products |
| 5.6 | Implement responsive design | Mobile: hamburger menu, single column view, collapsible filters. Tablet/Desktop: multi-column |
| 5.7 | Create customer API module | `api/product.api.js` — extend with public-only methods if needed |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T5.5 | HomePage | Renders all sections from API, slider auto-plays, error state handled |
| T5.6 | ProductListing | Filter checkboxes update query, grid/list toggle works, pagination navigates, search debounces |
| T5.7 | ProductDetail | Image gallery thumbnails switch main image, add to cart updates Redux, related products load |

---

## Phase 6: Cart & Checkout

**Duration:** 3–4 days  
**Goal:** Shopping cart, checkout flow, address management, order creation.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 6.1 | Create `Cart` model | `user` (unique ref), `items[]`: `{ product (ref), quantity, savedForLater }` |
| 6.2 | Create `Address` model | `user` (ref), `label`, `line1`, `line2`, `city`, `state`, `pincode`, `phone`, `isDefault` |
| 6.3 | Build cart routes | `GET /api/cart`, `POST /items` (add/increment), `PUT /items/:productId` (update qty), `DELETE /items/:productId` (remove), `POST /items/:productId/save-for-later` (toggle) |
| 6.4 | Build `POST /api/orders` | Validate stock for all items → create Order with auto-generated orderNumber → create OrderItems → clear cart → decrement inventory → return order |
| 6.5 | Build Address CRUD routes | `GET /api/addresses`, `POST`, `PUT /:id`, `DELETE /:id`, `PUT /:id/default` |
| 6.6 | Generate order number | Format: `ORD-YYYYMMDD-XXXXX`, auto-increment per day |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T6.1 | Cart add item | New item added, existing item increments qty, max qty validation |
| T6.2 | Cart remove/update | Decrement, remove item, save for later toggle |
| T6.3 | Order creation | Success flow: stock validated, order created, cart cleared, inventory decremented. Insufficient stock → 409 |
| T6.4 | Address CRUD | Create, update, delete, set default (unsets others) |
| T6.5 | Order number generation | Sequential per day, resets at midnight format |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 6.7 | Create CartPage | Items list with qty controls (+/-/remove), save for later section, subtotal/total summary, proceed to checkout button. Empty cart state |
| 6.8 | Create cartSlice (Redux) | Thunks: `fetchCart`, `addItem`, `updateQuantity`, `removeItem`, `toggleSaveForLater`, `clearCart`. State: `items`, `isLoading` |
| 6.9 | Create CheckoutPage | Multi-step: select/shipping address → review items → payment method → place order |
| 6.10 | Create AddressForm component | Fields: label, line1, line2, city, state, pincode, phone, set as default |
| 6.11 | Create OrderConfirmationPage | Success message, order number, summary, continue shopping button |
| 6.12 | Create AddressesPage (account) | List addresses, add/edit/delete, set default |
| 6.13 | Add cart badge to header | CartIcon in CustomerLayout shows item count from Redux |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T6.6 | CartPage | Empty state renders correctly, qty controls update Redux, remove item works, save for later toggles |
| T6.7 | CheckoutPage | Multi-step navigation, address selection required, place order sends API, loading state |
| T6.8 | cartSlice | Add/increment logic, duplicate product increments qty, clearCart resets |
| T6.9 | Cart badge | Count matches Redux state, updates on add/remove |

---

## Phase 7: Order Management

**Duration:** 3–4 days  
**Goal:** Order processing, status tracking, courier management.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 7.1 | Build `GET /api/orders` | Admin: all orders (filter by status/customer/date). Customer: own orders only. Paginated |
| 7.2 | Build `GET /api/orders/:id` | Full details with populated items, customer, address, courier |
| 7.3 | Build `PUT /api/orders/:id/status` | Validate transition per state machine (see `13-permissions-business-logic.md`), execute side effects (restock on cancel, notify) |
| 7.4 | Build `PUT /api/orders/:id/courier` | Add/update courier: `courierName`, `trackingNumber`, `dispatchDate`, `estimatedDelivery` |
| 7.5 | Create `Courier` model | `order` (ref), `courierName`, `trackingNumber`, `dispatchDate`, `estimatedDelivery`, `actualDelivery` |
| 7.6 | Order status side effects | Implement `handleStatusSideEffects()`: restock inventory on cancel/return, notify customer on each transition |
| 7.7 | Build `GET /api/orders/:id/tracking` | Public endpoint (by orderNumber or id) — returns status + courier info |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T7.1 | Order list | Admin sees all, customer sees own only, pagination, filters |
| T7.2 | Status transition | Valid transitions succeed, invalid → 409, side effects execute (stock restored on cancel) |
| T7.3 | Courier assignment | Create courier, update, tracking endpoint returns correct data |
| T7.4 | Full lifecycle | new → confirmed → packing → dispatched → delivered → (cannot go back to packing) |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 7.9 | Create OrderList page (admin) | DataTable: order number, customer, total, status badge (color-coded), date, actions. Filters: status dropdown, date range, customer search |
| 7.10 | Create OrderDetail page (admin) | Order info card, items table, status timeline (visual step indicator), courier info card, update status dropdown (only valid transitions), assign courier form |
| 7.11 | Create StatusBadge component | Color-coded badge: new (blue), confirmed (teal), packing (purple), dispatched (orange), delivered (green), cancelled (red), returned (gray) |
| 7.12 | Create StatusTimeline component | Vertical timeline showing each status with date/time, current status highlighted |
| 7.13 | Create OrderHistory page (customer) | Table: order number, date, total, status, link to detail |
| 7.14 | Create OrderTracking page (customer) | Status timeline + courier info with tracking number link |
| 7.15 | Create order API module | `api/order.api.js` — getAll, getById, updateStatus, assignCourier, createOrder |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T7.5 | OrderList | Filters work, status badge renders correct color, pagination |
| T7.6 | OrderDetail | Status dropdown only shows valid transitions, courier assignment saves, timeline renders |
| T7.7 | StatusBadge | Renders correct color and label for each status |
| T7.8 | Customer OrderHistory | Only customer's orders shown, links to detail |

---

## Phase 8: POS Billing System

**Duration:** 4–5 days  
**Goal:** Retail and wholesale POS billing with invoice generation.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 8.1 | Create `Invoice` model | `invoiceNumber` (auto-gen: `INV-YYYYMMDD-XXXXX`), `order` (nullable), `customer` (ref), `customerName` (snapshot), `items[]` (embedded: productName, quantity, price, total), `subtotal`, `discount`, `tax`, `total`, `amountPaid`, `balance`, `type` (retail/wholesale), `gstDetails` |
| 8.2 | Create `Payment` model | `invoice` (ref), `amount`, `method` (cash/upi/bank_transfer), `transactionRef`, `status` (pending/completed/failed/refunded), `date` |
| 8.3 | Build `POST /api/billing/invoice` | Accept items array, calculate totals, generate invoice number, create invoice, create payment record (if full/partial payment), optionally create Order |
| 8.4 | Build `GET /api/billing/invoices` | List invoices, filter by type/date/customer, paginated |
| 8.5 | Build `GET /api/billing/invoices/:id` | Full invoice detail |
| 8.6 | Build `GET /api/billing/invoices/:id/print` | Print-optimized data (plain structure for template rendering) |
| 8.7 | Build `GET /api/billing/search/product` | Search products by code/SKU/name for POS — returns `{ _id, name, code, sku, sellingPrice, stock, images }` |
| 8.8 | Build `POST /api/payments` | Record payment against invoice (partial/full) |
| 8.9 | Build `GET /api/payments` | Payment list, filterable |
| 8.10 | B2B: wholesale customer support | Customer type = 'wholesale', credit limit tracking, credit sales (partial payment) |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T8.1 | Invoice creation | Correct totals, invoice number format, stock decremented, items snapshot frozen |
| T8.2 | Product search | Search by code (prefix), sku, name — returns max 20, only in-stock |
| T8.3 | Payment recording | Full payment, partial payment, over-payment rejected |
| T8.4 | Wholesale billing | Credit limit enforced, credit sale allowed within limit |
| T8.5 | Invoice number | Sequential per day, resets at midnight |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 8.11 | Create POSBilling page | Split layout: left = search panel, right = invoice cart. Top: retail/wholesale toggle |
| 8.12 | Create POS search component | Auto-focus input, debounced search, product results list with code/name/price/stock, click to add |
| 8.13 | Create POS invoice cart component | Cart table: item rows (name, qty, rate, total), quantity +/- buttons, remove button. Footer: subtotal, discount field, total |
| 8.14 | Create PaymentDialog | Total displayed, amount paid input (defaults to total), method radio (Cash/UPI/Bank Transfer), transaction ref field (optional), balance display, complete button |
| 8.15 | Create InvoicePrint page | Print-optimized layout: store header, customer info, item table, totals, payment info, footer. Trigger `window.print()` or `react-to-print` |
| 8.16 | Create InvoiceList page | DataTable with invoice number, customer, date, total, status |
| 8.17 | Create InvoiceDetail page | Full invoice view with print button |
| 8.18 | Create billing API module | `api/billing.api.js` — createInvoice, list, getById, searchProducts, print |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T8.6 | POSBilling | Search returns products, click adds to cart, qty controls work, totals calc correctly |
| T8.7 | PaymentDialog | Amount defaults to total, balance calc for partial payment, method selection required |
| T8.8 | InvoicePrint | Invoice layout renders correct fields |
| T8.9 | InvoiceList | Lists invoices, filters work |

---

## Phase 9: Reporting & Analytics

**Duration:** 3–4 days  
**Goal:** Sales, inventory, order, and customer reports with export.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 9.1 | Build `GET /api/reports/sales` | Aggregation pipeline: group by period (daily/weekly/monthly/yearly). Return: `period`, `totalOrders`, `totalRevenue`, `averageOrderValue` |
| 9.2 | Build `GET /api/reports/inventory/stock` | All products with stock levels, category, status |
| 9.3 | Build `GET /api/reports/inventory/movement` | Stock transactions aggregated by product, filter by date/product/type |
| 9.4 | Build `GET /api/reports/orders` | Group by status, count + total revenue per status, filter by date range |
| 9.5 | Build `GET /api/reports/customers/top` | Top customers by total spend + total orders, `?limit=` param |
| 9.6 | Build `GET /api/reports/customers/purchases` | Single customer purchase history with totals |
| 9.7 | Build `GET /api/reports/export/sales?format=excel` | Generate Excel file using exceljs — columns: date, order#, customer, items, subtotal, tax, total |
| 9.8 | Build `GET /api/reports/export/sales?format=pdf` | Generate PDF file using pdfkit — same columns formatted as table |
| 9.9 | Build `GET /api/reports/export/inventory` | Excel export of current stock |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T9.1 | Sales report | Correct grouping by period, date filter respected, empty period returns empty array |
| T9.2 | Top customers | Correctly ordered by spend, limit respected, zero-spend customers excluded |
| T9.3 | Export Excel | File generated, correct MIME type, has headers + data rows |
| T9.4 | Export PDF | File generated, correct MIME type, readable content |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 9.10 | Create SalesReport page | Line/bar chart (Recharts), period selector tabs (daily/weekly/monthly/yearly), date range picker, summary cards (total revenue, total orders, avg order value), export buttons |
| 9.11 | Create InventoryReport page | Stock table + movement table, product filter, export button |
| 9.12 | Create OrderReport page | Pie chart by status, bar chart over time, summary table |
| 9.13 | Create CustomerReport page | Top customers table, customer search for individual purchase report |
| 9.14 | Create report API module | `api/report.api.js` — getSales, getInventory, getOrders, getCustomers, export |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T9.5 | SalesReport | Period tabs switch data, date picker filters, export button triggers download |
| T9.6 | Charts render | Recharts renders correctly with data, handles empty data gracefully |
| T9.7 | Export download | Correct file name, file type, data matches report |

---

## Phase 10: Hidden GST Module

**Duration:** 3–4 days  
**Goal:** GST module that exists in code but is completely hidden until enabled.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 10.1 | Create `GstSetting` model | `businessGstin`, `businessName`, `stateCode`, `address` |
| 10.2 | Create `HsnCode` model | `hsnCode` (unique), `description`, `gstRate` (0/5/12/18/28), `compensationCess` |
| 10.3 | Create `GstInvoice` model | `invoice` (ref), `cgst`, `sgst`, `igst`, `totalTax`, `taxableValue`, `hsnSummary[]` |
| 10.4 | Conditionally mount GST routes | In `app.js`: check `gstEnabled` setting, only then `app.use('/api/gst', gstRoutes)` |
| 10.5 | Create GST guard middleware | Double-check `gstEnabled` setting inside each controller as safety net |
| 10.6 | Build GST settings routes | `GET/PUT /api/gst/settings` — update business GSTIN, name, state |
| 10.7 | Build HSN code CRUD routes | `GET /api/gst/hsn`, `POST`, `PUT /:id`, `DELETE /:id` |
| 10.8 | Build GST invoice computation | Logic in `services/gst.service.js`: computeGST(taxableValue, gstRate, fromState, toState) → returns { cgst, sgst, igst, totalTax } |
| 10.9 | Integrate GST into invoice creation | If gstEnabled, compute and attach gstDetails to invoice |
| 10.10 | Build GST reports | `GET /api/gst/reports/sales`, `/tax-summary`, `/hsn` — aggregation pipelines |
| 10.11 | Hide GST product fields from API | If gstEnabled=false, strip `hsnCode` and `gstRate` from product responses |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T10.1 | GST routes 404 when disabled | All `/api/gst/*` endpoints return 404, frontend gets no GST data |
| T10.2 | GST routes work when enabled | Settings, HSN CRUD, reports all work after toggling on |
| T10.3 | GST computation | Intra-state: CGST + SGST. Inter-state: IGST. Correct amounts for all 5 slabs |
| T10.4 | Invoice with GST | gstDetails correctly calculated, stored, returned in invoice response |
| T10.5 | Product fields hidden | `hsnCode` and `gstRate` absent when gstEnabled=false |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 10.12 | Create GstRoute guard | Check `gstEnabled` (from settingsSlice) + Super Admin role → render children or redirect |
| 10.13 | Create GSTSettings page | Business GSTIN, name, state, address form. Accessible only at `/admin/system/gst/settings` |
| 10.14 | Create HSNList page | DataTable with HSN code, description, rate. Create/edit dialog |
| 10.15 | Create GSTReports page | Sales GST, tax summary, HSN-wise reports |
| 10.16 | Conditionally show GST fields on product form | `{gstEnabled && (<HSN Select> <GST Rate Select>)}` |
| 10.17 | Show GST breakdown on invoice | If gstEnabled: display HSN code, taxable value, CGST %, SGST %, total tax per item |
| 10.18 | Ensure NO sidebar links to GST | GST routes only accessible via direct URL — no nav items in any sidebar group |
| 10.19 | Create gst API module | `api/gst.api.js` — getSettings, updateSettings, hsn CRUD, reports |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T10.6 | GstRoute guard | Redirects when gstEnabled=false, renders when true + super_admin |
| T10.7 | Product form hides GST fields | HSN and GST rate fields absent when gstEnabled=false |
| T10.8 | Invoice shows GST | CGST/SGST columns visible when gstEnabled=true |
| T10.9 | Sidebar has no GST links | All nav groups checked — no `/admin/system/gst` link present |

---

## Phase 11: Dashboard

**Duration:** 2–3 days  
**Goal:** Admin dashboard with live KPIs.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 11.1 | Build `GET /api/dashboard` | Aggregated stats: `revenueToday`, `revenueThisMonth`, `totalOrders`, `pendingOrders`, `lowStockCount` (products below threshold), `topProducts` (top 5 by sales), `recentActivities` (last 10 activity logs) |
| 11.2 | Optimize dashboard query | Use aggregation pipeline with `$facet` for parallel computation |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T11.1 | Dashboard endpoint | All fields present, numbers match manual calculation, empty store returns zeros |
| T11.2 | Response time | Dashboard loads in < 500ms even with 10k+ orders |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 11.3 | Create Dashboard page | KPI cards row (revenue today, revenue month, total orders, pending, low stock). Revenue chart (last 7/30 days line chart). Top products table. Recent activity feed |
| 11.4 | Create KpiCard component | Icon, label, value, optional trend indicator (up/down arrow + percentage) |
| 11.5 | Create RecentActivities component | Scrollable list: user, action, resource, time ago |
| 11.6 | Auto-refresh dashboard | React Query `refetchInterval: 300000` (5 min) |
| 11.7 | Create dashboard API module | `api/dashboard.api.js` — `getDashboard()` |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T11.3 | Dashboard | KPI cards render with data, chart renders, activities list scrolls |
| T11.4 | KpiCard | Renders value, label, icon. Trend arrow shows correct direction |
| T11.5 | Auto-refresh | Query refetches after interval |

---

## Phase 12: Testing, Optimization & Deployment

**Duration:** 3–4 days  
**Goal:** Final test coverage, performance optimization, production deployment.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 12.1 | Add remaining integration tests | Ensure every endpoint has at least: success case, auth failure, validation failure, RBAC failure |
| 12.2 | Add API documentation | Create `api-docs.md` or integrate Swagger via `swagger-jsdoc` + `swagger-ui-express` |
| 12.3 | Performance audit | Profile slow endpoints, add `.lean()` to all read queries, ensure indexes cover all common queries |
| 12.4 | Production config | `config/env.js` — environment-aware settings for DB, CORS, rate limits |
| 12.5 | Create Dockerfile | Multi-stage build for production |
| 12.6 | Create nginx.conf | Reverse proxy, static files, caching, compression, SSL |
| 12.7 | Add health check | `GET /api/health` — `{ status: 'ok', uptime, db: 'connected' }` |
| 12.8 | Add graceful shutdown | `process.on('SIGTERM')` — close DB, http server, exit |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T12.1 | Full integration suite | All endpoints covered, run with `jest --coverage`, target >70% line coverage |
| T12.2 | Health check | Returns 200, db status reflects actual connection |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 12.9 | Add remaining component tests | Ensure all shared components have basic render tests |
| 12.10 | Add route guard tests | ProtectedRoute, AdminRoute, GstRoute all tested |
| 12.11 | Lazy load all admin routes | `React.lazy()` + `Suspense` for every admin page |
| 12.12 | Production build | `npm run build` — verify minified chunks, analyze bundle size |
| 12.13 | Performance audit | Lighthouse audit: target >80 on mobile, >90 on desktop. Optimize images, reduce JS |
| 12.14 | Create Dockerfile | Multi-stage: build → nginx static serve |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T12.4 | Lazy loading | Route components load only when navigated to |
| T12.5 | Bundle size | Code-split chunks under 200KB each |
| T12.6 | Lighthouse | Accessibility, performance, SEO scores |

### DevOps Tasks

| # | Task | Details |
|---|---|---|
| 12.15 | Create GitHub Actions CI | `.github/workflows/ci.yml` — lint → test → build on push/PR |
| 12.16 | Create GitHub Actions CD | `.github/workflows/deploy.yml` — auto-deploy on main push |
| 12.17 | Create deployment checklist | Complete `12-deployment-and-devops.md` checklist |
| 12.18 | Production smoke test | Full flow: admin login → create product → customer registers → purchase → order fulfilled |

---

## Executive Summary

| Phase | Backend Tasks | Backend Tests | Frontend Tasks | Frontend Tests | Est. Days |
|---|---|---|---|---|---|
| ✅ 1 | Auth + Roles | 18 | 8 | 16 | 6 | 3–5 |
| ✅ 2 | Product Management | 12 | 9 | 12 | 6 | 4–6 |
| 3 | Inventory Management | 9 | 6 | 7 | 3 | 3–4 |
| 4 | Homepage CMS | 7 | 4 | 4 | 2 | 2–3 |
| 5 | Customer Website | 2 | 2 | 5 | 3 | 4–5 |
| 6 | Cart & Checkout | 6 | 5 | 7 | 4 | 3–4 |
| 7 | Order Management | 7 | 4 | 7 | 4 | 3–4 |
| 8 | POS Billing | 10 | 5 | 8 | 4 | 4–5 |
| 9 | Reporting | 9 | 4 | 5 | 3 | 3–4 |
| 10 | Hidden GST | 11 | 5 | 8 | 4 | 3–4 |
| 11 | Dashboard | 2 | 2 | 5 | 3 | 2–3 |
| 12 | Deploy + Optimize | 8 | 2 | 6 | 3 | 3–4 |
| **Total** | **101** | **56** | **90** | **45** | | **40–52** |
