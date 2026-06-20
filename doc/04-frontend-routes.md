# RINBILL — Frontend Routes & Pages

---

## Route Structure

```
/                              → Customer Website
/admin/*                       → Admin Portal
```

---

## Customer Website Routes

| Path | Page Component | Auth | Description |
|---|---|---|---|
| `/` | `HomePage` | No | Hero slider, featured products, top categories, new arrivals, best sellers, promotional banners |
| `/products` | `ProductListing` | No | Grid/list view, sidebar filters (category, brand, price range), search, sort, pagination |
| `/products/:slug` | `ProductDetail` | No | Images, description, add to cart, related products |
| `/cart` | `CartPage` | Yes | Cart items, quantity controls, save for later, total, checkout button |
| `/checkout` | `CheckoutPage` | Yes | Address selection → shipping → payment method → order review → place order |
| `/account/login` | `LoginPage` | No | Email + password form |
| `/account/register` | `RegisterPage` | No | Registration form |
| `/account/forgot-password` | `ForgotPassword` | No | Email input → OTP → reset form |
| `/account/profile` | `ProfilePage` | Yes | View/edit personal info |
| `/account/addresses` | `AddressesPage` | Yes | CRUD addresses |
| `/account/orders` | `OrderHistory` | Yes | Paginated order list |
| `/account/orders/:id` | `OrderDetail` | Yes | Order items, status timeline, courier tracking |
| `/account/wishlist` | `WishlistPage` | Yes | Saved products |

---

## Admin Portal Routes

All admin routes are wrapped in `AdminLayout` (sidebar + header).

| Path | Page Component | Role | Description |
|---|---|---|---|
| `/admin` | `Dashboard` | All staff | KPI widgets, charts, recent activity |
| `/admin/products` | `ProductList` | Ecom Staff+ | Data table with search, filters, bulk actions |
| `/admin/products/new` | `ProductForm` | Ecom Staff+ | Create product form |
| `/admin/products/:id/edit` | `ProductForm` | Ecom Staff+ | Edit product |
| `/admin/categories` | `CategoryList` | Ecom Staff+ | CRUD data table |
| `/admin/brands` | `BrandList` | Ecom Staff+ | CRUD data table |
| `/admin/inventory` | `InventoryPage` | Ecom Staff+ | Stock overview, stock in/out/adjust forms, history log |
| `/admin/orders` | `OrderList` | Ecom Staff+ | Order data table, status filter |
| `/admin/orders/:id` | `OrderDetail` | Ecom Staff+ | Order details, status update, courier assignment |
| `/admin/customers` | `CustomerList` | All staff | Search customers, view profiles |
| `/admin/customers/:id` | `CustomerDetail` | All staff | Profile, order history, spend stats |
| `/admin/billing` | `POSBilling` | Billing Staff+ | POS terminal interface |
| `/admin/billing/invoices` | `InvoiceList` | Billing Staff+ | Invoice data table |
| `/admin/billing/invoices/:id` | `InvoiceDetail` | Billing Staff+ | Invoice view + print |
| `/admin/payments` | `PaymentList` | Billing Staff+ | Payment records |
| `/admin/cms/sliders` | `SliderManager` | Ecom Staff+ | Drag-and-drop slider CRUD |
| `/admin/cms/banners` | `BannerManager` | Ecom Staff+ | Banner CRUD |
| `/admin/cms/featured` | `FeaturedManager` | Ecom Staff+ | Select products for featured/best-seller/new-arrival |
| `/admin/users` | `UserList` | Super Admin | Manage staff users |
| `/admin/users/new` | `UserForm` | Super Admin | Create staff user |
| `/admin/users/:id/edit` | `UserForm` | Super Admin | Edit user |
| `/admin/settings` | `SettingsPage` | Super Admin | Feature toggles, system config |
| `/admin/reports/sales` | `SalesReport` | All staff | Sales charts, period filter, export |
| `/admin/reports/inventory` | `InventoryReport` | Ecom Staff+ | Stock report, movement report |
| `/admin/reports/orders` | `OrderReport` | All staff | Order status analytics |
| `/admin/reports/customers` | `CustomerReport` | All staff | Top customers, purchase reports |

**Hidden GST Routes (no sidebar link, direct URL only):**

| Path | Page Component | Role | Condition |
|---|---|---|---|
| `/admin/system/gst` | `GSTDashboard` | Super Admin | gstEnabled=true |
| `/admin/system/gst/settings` | `GSTSettings` | Super Admin | gstEnabled=true |
| `/admin/system/gst/hsn` | `HSNList` | Super Admin | gstEnabled=true |
| `/admin/system/gst/reports` | `GSTReports` | Super Admin | gstEnabled=true |

---

## Route Guards

### ProtectedRoute
- Checks for valid access token in Redux store
- Redirects to `/account/login` if unauthenticated
- Wraps: all `/account/*`, `/cart`, `/checkout`

### AdminRoute
- Checks authentication + role permissions
- Accepts `allowedRoles` prop (`['super_admin', 'ecommerce_staff', 'billing_staff']`)
- Redirects to `/admin` with error toast if unauthorized
- Wraps: all `/admin/*`

### GstRoute
- Checks: authenticated + Super Admin role + `gstEnabled === true` (from settings)
- Returns 404 or redirects to `/admin` if condition not met
- Wraps: `/admin/system/gst/*`

---

## Component Tree — Admin Layout

```
AdminLayout
├── Sidebar
│   ├── Logo
│   ├── NavGroup (Dashboard)
│   ├── NavGroup (Products)          — Ecom Staff+
│   │   ├── All Products
│   │   ├── Categories
│   │   └── Brands
│   ├── NavGroup (Inventory)         — Ecom Staff+
│   ├── NavGroup (Orders)            — Ecom Staff+
│   ├── NavGroup (Customers)         — All staff
│   ├── NavGroup (Billing)           — Billing Staff+
│   │   ├── POS Billing
│   │   └── Invoices
│   ├── NavGroup (CMS)              — Ecom Staff+
│   │   ├── Sliders
│   │   ├── Banners
│   │   └── Featured Products
│   ├── NavGroup (Reports)          — All staff
│   └── NavGroup (System)           — Super Admin only
│       ├── Users
│       └── Settings
│   └── [NO GST LINK — hidden]
├── Header
│   ├── SearchBar
│   ├── NotificationsBell
│   └── UserMenu (profile, logout)
└── Main Content (Outlet)
```

## Component Tree — Customer Layout

```
CustomerLayout
├── Header
│   ├── Logo
│   ├── MainNav (Home, Products, About, Contact)
│   ├── SearchBar
│   ├── WishlistIcon
│   ├── CartIcon (with badge)
│   └── UserMenu (Login/Register or Profile dropdown)
├── Main Content (Outlet)
└── Footer
    ├── Links
    ├── Contact Info
    └── Social Media
```
