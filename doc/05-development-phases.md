# RINBILL — Development Phases

12 phases, estimated total: **~40-52 days**

---

## Phase 1 — Authentication + Roles (3-5 days)

**Goal:** User registration, login, JWT auth, role-based access control.

### Backend Tasks
- [ ] Initialize Express project, install deps, set up folder structure
- [ ] MongoDB connection config (`config/db.js`)
- [ ] `User`, `Role` models with timestamps
- [ ] Seed script: default roles (super_admin, billing_staff, ecommerce_staff, customer) + super admin user
- [ ] Auth middleware (JWT verify, extract user)
- [ ] RBAC middleware (check role against allowed permissions)
- [ ] Auth routes: register, login, refresh, forgot-password, verify-otp, reset-password, me
- [ ] bcrypt password hashing on User model pre-save hook
- [ ] Access token (15m) + refresh token (7d) logic
- [ ] Error handler middleware

### Frontend Tasks
- [ ] Initialize Vite + React project
- [ ] Install Tailwind CSS + configure
- [ ] Set up shadcn UI (button, input, card, form, dialog, etc.)
- [ ] Redux store setup: authSlice, uiSlice
- [ ] Axios instance with interceptors (attach token, handle 401 refresh)
- [ ] Login page
- [ ] Register page
- [ ] Forgot Password / Reset Password pages
- [ ] AdminLayout component (sidebar + header)
- [ ] CustomerLayout component (navbar + footer)
- [ ] ProtectedRoute component
- [ ] AdminRoute component (role check)

### Deliverables
- [ ] Working login/register flow
- [ ] Role-based route protection on frontend
- [ ] JWT token refresh working
- [ ] Admin sidebar visible only to authenticated staff

---

## Phase 2 — Product Management (4-6 days)

**Goal:** Full CRUD for categories, brands, and products.

### Backend Tasks
- [ ] `Category`, `Brand`, `Product` models
- [ ] File upload config (`config/cloudinary.js`)
- [ ] Category routes + controller (CRUD)
- [ ] Brand routes + controller (CRUD)
- [ ] Product routes + controller (CRUD, search, filter, sort, paginate)
- [ ] Image upload endpoint (multiple images, gallery)
- [ ] Product listing query builder (search text, filter by category/brand/price, sort)

### Frontend Tasks
- [ ] Category management page (data table + create/edit dialog)
- [ ] Brand management page (data table + create/edit dialog)
- [ ] Product list page (data table with search, filters, pagination)
- [ ] Product create/edit form (react-hook-form + shadcn form components)
- [ ] Image uploader component (Cloudinary upload widget or drag-and-drop)
- [ ] Category/Brand dropdown selects (with search)

### Deliverables
- [ ] Admin can create/edit/delete categories, brands, products
- [ ] Product listing with search, filter, sort, pagination
- [ ] Multiple image upload per product

---

## Phase 3 — Inventory Management (3-4 days)

**Goal:** Stock tracking, in/out/adjust, history, low-stock alerts.

### Backend Tasks
- [ ] `Inventory`, `StockTransaction` models
- [ ] Stock in endpoint (increases stock, logs transaction)
- [ ] Stock out endpoint (decreases stock, logs transaction)
- [ ] Stock adjustment endpoint (sets exact quantity, logs reason)
- [ ] History endpoint (paginated, filterable by product/type/date)
- [ ] Low-stock detection endpoint
- [ ] Auto-create inventory record on product creation

### Frontend Tasks
- [ ] Inventory overview page (product stock table)
- [ ] Stock in/out form (modal)
- [ ] Stock adjustment form (modal, Super Admin only)
- [ ] History log page (filterable data table)
- [ ] Low stock alerts badge in sidebar

### Deliverables
- [ ] Staff can add/remove/adjust stock
- [ ] Full audit trail of movements
- [ ] Low-stock products flagged

---

## Phase 4 — Homepage CMS (2-3 days)

**Goal:** Admin can manage homepage content without code.

### Backend Tasks
- [ ] `Slider`, `Banner`, `FeaturedProduct` models
- [ ] Slider CRUD + reorder endpoint
- [ ] Banner CRUD
- [ ] Featured products CRUD (assign product to featured/best-seller/new-arrival sections)
- [ ] Public endpoints: active sliders (ordered), active banners, featured products

### Frontend Tasks
- [ ] Slider manager (drag-and-drop reorder, image upload, schedule)
- [ ] Banner manager (CRUD)
- [ ] Featured products manager (searchable product selector)

### Deliverables
- [ ] Admin can add/edit/delete/reorder sliders
- [ ] Admin can manage banners and featured sections
- [ ] Public API returns CMS content for homepage

---

## Phase 5 — Customer Website (4-5 days)

**Goal:** Build the public-facing e-commerce site.

### Frontend Tasks
- [ ] Homepage with dynamic sections (slider, featured, categories, new arrivals, best sellers, banners)
- [ ] Product listing page (grid/list toggle, sidebar filters, search, sort, pagination)
- [ ] Product detail page (image gallery, specs, add to cart)

### Deliverables
- [ ] Public homepage renders CMS-managed content
- [ ] Product browsing with full filtering
- [ ] Responsive design (mobile + desktop)

---

## Phase 6 — Cart & Checkout (3-4 days)

**Goal:** Shopping cart, checkout flow, address management.

### Backend Tasks
- [ ] `Cart` model (embedded items)
- [ ] Cart CRUD (add, update qty, remove, save for later)
- [ ] `Address` model + CRUD
- [ ] Order creation endpoint (validate stock → create order → clear cart → deduct inventory)
- [ ] Order number auto-generation

### Frontend Tasks
- [ ] Cart page (items, qty controls, total, save for later)
- [ ] Address management (add/edit/select)
- [ ] Checkout flow: address → shipping → payment method → review → place order
- [ ] Order confirmation page

### Deliverables
- [ ] Full cart functionality
- [ ] Multi-step checkout
- [ ] Order placed = stock deducted + cart cleared

---

## Phase 7 — Order Management (3-4 days)

**Goal:** Order processing, status tracking, courier management.

### Backend Tasks
- [ ] Order status update endpoint (with validation of allowed transitions)
- [ ] Courier assignment endpoint
- [ ] Customer order history endpoint
- [ ] Public order tracking endpoint (by order number)
- [ ] `Courier` model

### Frontend Tasks
- [ ] Admin order list (status filters, date range, customer search)
- [ ] Admin order detail (items, status timeline, assign courier, update status)
- [ ] Customer order history page
- [ ] Customer order tracking (status timeline + courier info)
- [ ] Status badge component (color-coded)

### Deliverables
- [ ] Admin can process orders through entire lifecycle
- [ ] Customers can track orders
- [ ] Courier assignment working

---

## Phase 8 — Billing System (4-5 days)

**Goal:** POS billing for retail and wholesale.

### Backend Tasks
- [ ] `Invoice`, `Payment` models
- [ ] Invoice creation (add items, calculate total, generate invoice number)
- [ ] Barcode/SKU product search (for POS)
- [ ] Invoice list + detail endpoints
- [ ] Invoice print-optimized endpoint
- [ ] Payment recording endpoint
- [ ] B2B: dealer account management, credit sales

### Frontend Tasks
- [ ] POS terminal UI (product search, cart-style item list, total, payment)
- [ ] Quick billing mode (barcode scanner input)
- [ ] Invoice list + detail page
- [ ] Invoice print view (react-to-print or PDF generation)
- [ ] Payment entry form
- [ ] Retail vs wholesale toggle in POS

### Deliverables
- [ ] Staff can create invoices in seconds
- [ ] Printed invoice output
- [ ] Payment recording
- [ ] B2B credit sale support

---

## Phase 9 — Reporting (3-4 days)

**Goal:** Comprehensive reports with export.

### Backend Tasks
- [ ] Sales report aggregation (daily/weekly/monthly/yearly)
- [ ] Inventory report (current stock, movement)
- [ ] Order report (by status)
- [ ] Customer report (top customers, purchase history)
- [ ] Excel export (exceljs)
- [ ] PDF export (pdfkit)

### Frontend Tasks
- [ ] Sales report page (Recharts line/bar charts, period selector)
- [ ] Inventory report page (tables + charts)
- [ ] Order report page (pie chart by status)
- [ ] Customer report page (top customers table)
- [ ] Export buttons (Excel / PDF)

### Deliverables
- [ ] All report types generating correct data
- [ ] Charts rendering on frontend
- [ ] Excel and PDF downloads working

---

## Phase 10 — Hidden GST Module (3-4 days)

**Goal:** GST module that is completely hidden until enabled.

### Backend Tasks
- [ ] `GstSetting`, `HsnCode`, `GstInvoice`, `GstReport` models
- [ ] GST settings CRUD
- [ ] HSN code CRUD
- [ ] GST invoice computation (CGST/SGST for intra-state, IGST for inter-state)
- [ ] GST reports aggregation
- [ ] GST routes mounted conditionally based on `gstEnabled` setting
- [ ] Middleware: block GST API access if disabled

### Frontend Tasks
- [ ] GST settings page (business GSTIN, state code)
- [ ] HSN code management (CRUD data table)
- [ ] GST reports (sales, tax summary, HSN-wise)
- [ ] GST route guard (check gstEnabled + Super Admin)
- [ ] NO sidebar links to GST pages
- [ ] GST fields on product form (hsnCode, gstRate) — hidden when disabled
- [ ] GST details on invoice (CGST/SGST/IGST breakdown)

### Deliverables
- [ ] GST completely invisible when disabled
- [ ] Super Admin can enable GST via settings
- [ ] Once enabled: HSN management, GST invoices, GST reports all work

---

## Phase 11 — Dashboard (2-3 days)

**Goal:** Admin dashboard with live KPIs.

### Backend Tasks
- [ ] Aggregated dashboard endpoint (revenue today/month, order counts, low stock count, top products, recent activities)

### Frontend Tasks
- [ ] KPI cards (revenue today, revenue month, total orders, pending orders, low stock)
- [ ] Revenue chart (last 7/30 days)
- [ ] Top products table
- [ ] Recent activity feed

### Deliverables
- [ ] Dashboard loads with real-time aggregated data
- [ ] Charts and cards update on data change

---

## Phase 12 — Testing & Deployment (3-4 days)

**Goal:** Test coverage, CI/CD, production deployment.

### Backend Tasks
- [ ] API integration tests (Jest + Supertest) for all major endpoints
- [ ] Auth tests (login, register, token refresh, RBAC)
- [ ] Product CRUD tests
- [ ] Order flow tests
- [ ] Environment configuration (`.env.production`)
- [ ] Dockerfile + docker-compose.yml
- [ ] CORS, helmet, rate limiter tuned for production

### Frontend Tasks
- [ ] Component smoke tests (React Testing Library)
- [ ] Route guard tests
- [ ] Build optimization (code splitting, lazy loading)
- [ ] Vite production build config

### DevOps
- [ ] CI pipeline (lint → test → build)
- [ ] Deployment guide (VPS / Railway / Render / AWS)

### Deliverables
- [ ] Test suite passing
- [ ] Production build ready
- [ ] Deployment documentation

---

## Phase Dependency Graph

```
Phase 1 (Auth)
   │
   ▼
Phase 2 (Products) ──► Phase 5 (Website) ──► Phase 6 (Cart/Checkout)
   │                                              │
   ▼                                              ▼
Phase 3 (Inventory)                          Phase 7 (Orders)
   │                                              │
   ▼                                              ▼
Phase 4 (CMS)                               Phase 8 (Billing)
   │                                              │
   ▼                                              ▼
Phase 5 (Website) ────────────────────►      Phase 9 (Reports)
                                                   │
                                                   ▼
                                             Phase 10 (GST)
                                                   │
                                                   ▼
                                             Phase 11 (Dashboard)
                                                   │
                                                   ▼
                                             Phase 12 (Testing/Deploy)
```

**Parallel tracks possible:** Phase 4 (CMS) can run alongside Phase 3. Phase 11 (Dashboard) can run alongside Phase 9 (Reports).
