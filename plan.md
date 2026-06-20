# RINBILL — Phase-by-Phase Development Plan

> Each phase contains numbered tasks for implementation + testing (backend & frontend).

---

## Phase 1: Authentication & Role-Based Access Control

**Duration:** 3–5 days  
**Goal:** User registration, login, JWT auth, role/permission system.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 1.1 | Initialize Express project | `npm init`, install deps, create folder structure per `01-system-architecture.md` |
| 1.2 | Set up MongoDB connection | `config/db.js` — connect mongoose, handle connection events |
| 1.3 | Create `Role` model | Fields: `name`, `permissions[]`, `description`. Seed: super_admin (all \*), billing_staff, ecommerce_staff, customer |
| 1.4 | Create `User` model | Fields: `name`, `email`, `password`, `role` (ref Role), `phone`, `avatar`, `isActive`, `isVerified`, `refreshToken`, OTP fields. Pre-save hook: bcrypt hash password (12 rounds) |
| 1.5 | Create auth middleware | `auth.js` — verify JWT from `Authorization: Bearer` header, attach `req.user` |
| 1.6 | Create RBAC middleware | `rbac.js` — accept permission strings, check against `req.user.permissions`. Support wildcard `*` and `resource.*` patterns |
| 1.7 | Build `POST /api/auth/register` | Validate input (Joi), create user, generate tokens, return user + tokens |
| 1.8 | Build `POST /api/auth/login` | Find user by email, compare password, generate access token (15m) + refresh token (7d), set cookie |
| 1.9 | Build `POST /api/auth/refresh` | Verify refresh token, issue new access token |
| 1.10 | Build `POST /api/auth/forgot-password` | Generate 6-digit OTP, store hashed + expiry, send email |
| 1.11 | Build `POST /api/auth/verify-otp` | Compare OTP, mark verified |
| 1.12 | Build `POST /api/auth/reset-password` | Accept new password, hash and save |
| 1.13 | Build `GET /api/auth/me` | Return current user with populated role + permissions |
| 1.14 | Build `PUT /api/auth/me` | Update name, phone, avatar |
| 1.15 | Create error handler middleware | Global handler for Mongoose validation, duplicate key, CastError, JWT errors |
| 1.16 | Create rate limiter | `express-rate-limit` — 5 req/min for auth routes, 100/15min for general |
| 1.17 | Seed script | `seeds/index.js` — create default roles, super admin user, default settings |
| 1.18 | Add security middleware | `helmet`, `cors` (frontend origin), `morgan` (logging) |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T1.1 | Register | Success, duplicate email, missing fields, invalid email format, weak password |
| T1.2 | Login | Success, wrong password, non-existent email, inactive user |
| T1.3 | Token refresh | Success, expired refresh token, invalid token |
| T1.4 | Forgot/Reset password | OTP generation, OTP expiry, invalid OTP, password reset, reuse protection |
| T1.5 | Auth middleware | Missing token, expired token, malformed token, invalid signature |
| T1.6 | RBAC middleware | Super admin passes all, billing staff can't create products, customer can't access admin |
| T1.7 | Rate limiting | Exceed auth rate limit → 429 |
| T1.8 | Error handler | Validation error shape, duplicate key error, cast error |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 1.19 | Initialize Vite + React project | `npm create vite@latest`, install Tailwind + PostCSS + Autoprefixer + shadcn |
| 1.20 | Configure shadcn UI | `npx shadcn-ui@latest init`, add: button, input, card, form, dialog, toast, label, separator |
| 1.21 | Set up Redux store | `configureStore` with authSlice, uiSlice. Configure Redux Provider |
| 1.22 | Set up React Query | `QueryClientProvider` with default staleTime (5min) |
| 1.23 | Create Axios instance | Base URL, interceptor for Bearer token, 401 → refresh → retry, unwrap response envelope |
| 1.24 | Create authSlice | State: `user`, `accessToken`, `isAuthenticated`, `isLoading`. Thunks: `login`, `register`, `refreshToken`, `logout`, `updateProfile` |
| 1.25 | Create LoginPage | Email + password form, validation, error display, redirect to dashboard on success |
| 1.26 | Create RegisterPage | Name, email, password, confirm password. Redirect to login after success |
| 1.27 | Create ForgotPasswordPage | Email input → OTP input → new password form |
| 1.28 | Create AuthLayout | Centered card layout for auth pages, logo |
| 1.29 | Create AdminLayout | Sidebar (collapsible) + header (user menu) + `<Outlet>`. Role-based nav groups |
| 1.30 | Create CustomerLayout | Navbar (logo, search, cart icon, user menu) + footer + `<Outlet>` |
| 1.31 | Create ProtectedRoute | Check `isAuthenticated`, redirect to `/account/login` |
| 1.32 | Create AdminRoute | Check auth + role permissions, redirect to `/admin` on failure |
| 1.33 | Create AppRoutes | Compose all route groups with lazy loading |
| 1.34 | Create ProfilePage | Display + edit name, email, phone, avatar |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T1.9 | LoginPage | Renders form, validates empty fields, shows error on bad credentials, navigates on success |
| T1.10 | RegisterPage | Validates password match, shows server errors, redirects on success |
| T1.11 | ProtectedRoute | Redirects unauthenticated users, renders children when authenticated |
| T1.12 | AdminRoute | Blocks billing staff from product routes, allows super admin |
| T1.13 | authSlice | Login sets user + token, logout clears state, refreshToken updates token |
| T1.14 | Axios interceptor | Attaches token, retries on 401, dispatches logout on refresh failure |

---

## Phase 2: Product Management

**Duration:** 4–6 days  
**Goal:** Full CRUD for categories, brands, and products with images.

### Backend Tasks

| # | Task | Details |
|---|---|---|
| 2.1 | Create `Category` model | `name`, `slug` (auto, unique), `image`, `description`, `isActive` |
| 2.2 | Create `Brand` model | `name`, `logo`, `description` |
| 2.3 | Create `Product` model | All fields per OVERVIEW.md: `name`, `code` (unique, auto-gen), `sku` (unique), `category` (ref), `brand` (ref), `vehicleCompatibility[]`, `description`, `shortDescription`, `images[]`, `galleryImages[]`, `sellingPrice`, `costPrice`, `stock`, `lowStockLimit`, `weight`, `status` (active/inactive/draft), `hsnCode`, `gstRate` |
| 2.4 | Configure Cloudinary | `config/cloudinary.js` — SDK + multer-storage-cloudinary. Folder routing by resource type |
| 2.5 | Build Category CRUD routes | `GET /api/categories` (public active), `GET /all` (admin), `POST`, `PUT /:id`, `DELETE /:id` |
| 2.6 | Build Brand CRUD routes | `GET /api/brands` (public), `POST`, `PUT /:id`, `DELETE /:id` |
| 2.7 | Build Product CRUD routes | `GET /api/products` (search, filter, sort, paginate), `GET /featured` (sections), `GET /:slug`, `POST`, `PUT /:id`, `DELETE /:id` (soft delete) |
| 2.8 | Build product image upload | `POST /api/products/:id/images` — accept array (max 10), upload to Cloudinary, store URLs |
| 2.9 | Build product image delete | `DELETE /api/products/:id/images/:imageId` — destroy on Cloudinary, remove URL from array |
| 2.10 | Build product listing query | Text search ($or with $regex), filter by category/brand/price range, sort (price_asc, price_desc, newest, name), offset pagination |
| 2.11 | Add Joi validators | `createProductSchema`, `updateProductSchema`, category schema, brand schema. Conditional GST fields based on gstEnabled context |
| 2.12 | Create pagination helper | `utils/paginate.js` — generic paginate(Model, query, options) returning `{ data, meta }` |

### Backend Testing

| # | Test | What to Cover |
|---|---|---|
| T2.1 | Category CRUD | Create, update, delete, list active only, duplicate name slug, delete with products attached (block) |
| T2.2 | Brand CRUD | Same pattern as categories |
| T2.3 | Product create | All required fields, duplicate code/SKU, invalid category ref, missing sellingPrice |
| T2.4 | Product update | Partial update, changing category, clearing images |
| T2.5 | Product listing | Search by name/code/SKU, filter by category/brand/price, sort, pagination metadata |
| T2.6 | Product delete | Soft delete (status = inactive), re-activate |
| T2.7 | Image upload | Success, exceeds max count, invalid file type, file too large, no auth |
| T2.8 | Image delete | Success, invalid imageId, Cloudinary destroy error |
| T2.9 | Auth + RBAC | Public can only list active products, billing staff cannot create/edit |

### Frontend Tasks

| # | Task | Details |
|---|---|---|
| 2.13 | Create DataTable component | Reusable table: columns config, sortable headers, loading skeleton, empty state, row click |
| 2.14 | Create SearchInput component | Debounced input (400ms), clear button |
| 2.15 | Create Pagination component | Page numbers, prev/next, page size selector |
| 2.16 | Create ConfirmDialog component | Modal: title, message, confirm/cancel buttons, destructive variant |
| 2.17 | Create FileUpload component | Drag-and-drop zone, preview thumbnails, remove individual, upload progress |
| 2.18 | Create CategoryList page | DataTable + Create/Edit dialog (name, description, image upload, status toggle) |
| 2.19 | Create BrandList page | DataTable + Create/Edit dialog (name, description, logo upload) |
| 2.20 | Create ProductList page | DataTable with search, filter dropdowns (category, brand, status, price range), pagination, toolbar (new, export) |
| 2.21 | Create ProductForm page | Full form: name, code, SKU, category select (searchable), brand select, price fields, rich text description, short description, vehicle compatibility (tag input), image uploader, gallery uploader, stock fields, status, weight |
| 2.22 | Create product API module | `api/product.api.js` — getAll, getBySlug, create, update, delete, uploadImages, deleteImage |
| 2.23 | Create category API module | `api/category.api.js` — getAll, create, update, delete |
| 2.24 | Create brand API module | Same pattern |

### Frontend Testing

| # | Test | What to Cover |
|---|---|---|
| T2.10 | CategoryList | Renders table, opens create dialog, submits form, shows success toast |
| T2.11 | ProductForm | Validates required fields, shows validation errors, submits with FormData, handles upload progress |
| T2.12 | DataTable | Renders columns, shows loading skeleton, handles empty state, calls onRowClick |
| T2.13 | SearchInput | Debounces value, calls onChange after delay, clears input |
| T2.14 | Pagination | Renders page numbers, disables prev on page 1, calls onChange |
| T2.15 | FileUpload | Shows previews, removes on click, calls onUpload with FormData |

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
| 1 | Auth + Roles | 18 | 8 | 16 | 6 | 3–5 |
| 2 | Product Management | 12 | 9 | 12 | 6 | 4–6 |
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
