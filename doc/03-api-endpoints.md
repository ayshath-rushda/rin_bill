# RINBILL — REST API Endpoints

Base URL: `/api`

---

## Auth (`/api/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | /register | No | — | Customer self-registration |
| POST | /login | No | — | Login, returns access + refresh tokens |
| POST | /refresh | No | — | Exchange refresh token for new access token |
| POST | /forgot-password | No | — | Send OTP to email |
| POST | /verify-otp | No | — | Verify OTP |
| POST | /reset-password | No | — | Reset password with verified OTP |
| GET | /me | Yes | Any | Get current user profile |
| PUT | /me | Yes | Any | Update own profile |
| PUT | /me/password | Yes | Any | Change password |

---

## Users (`/api/users`) — Super Admin only

| Method | Endpoint | Description |
|---|---|---|
| GET | / | List all users (paginated, filterable) |
| GET | /:id | Get single user |
| POST | / | Create user (admin creates staff) |
| PUT | /:id | Update user |
| PATCH | /:id/status | Activate/deactivate user |
| DELETE | /:id | Delete user |

---

## Categories (`/api/categories`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | No | — | List active categories |
| GET | /all | Yes | Ecom Staff+ | List all (including inactive) |
| GET | /:slug | No | — | Get single by slug |
| POST | / | Yes | Ecom Staff+ | Create |
| PUT | /:id | Yes | Ecom Staff+ | Update |
| DELETE | /:id | Yes | Ecom Staff+ | Delete (check no products) |

---

## Brands (`/api/brands`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | No | — | List brands |
| POST | / | Yes | Ecom Staff+ | Create |
| PUT | /:id | Yes | Ecom Staff+ | Update |
| DELETE | /:id | Yes | Ecom Staff+ | Delete |

---

## Products (`/api/products`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | No | — | List (search, filter by category/brand, sort, paginate) |
| GET | /featured | No | — | Featured/best-seller/new-arrivals |
| GET | /:slug | No | — | Get single product |
| POST | / | Yes | Ecom Staff+ | Create product |
| PUT | /:id | Yes | Ecom Staff+ | Update |
| DELETE | /:id | Yes | Ecom Staff+ | Soft delete (status: inactive) |
| POST | /:id/images | Yes | Ecom Staff+ | Upload images to Cloudinary |
| DELETE | /:id/images/:imageId | Yes | Ecom Staff+ | Remove image |

**Query params for GET /:** `search`, `category`, `brand`, `minPrice`, `maxPrice`, `sortBy` (price_asc, price_desc, newest, name), `page`, `limit`, `status` (admin only)

---

## Inventory (`/api/inventory`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | Yes | Ecom Staff+ | Current stock overview |
| GET | /:productId | Yes | Ecom Staff+ | Stock for single product |
| POST | /stock-in | Yes | Ecom Staff+ | Increase stock |
| POST | /stock-out | Yes | Ecom Staff+ | Decrease stock (e.g., damaged, expired) |
| POST | /adjust | Yes | Super Admin | Manual stock correction |
| GET | /history | Yes | Ecom Staff+ | Paginated stock movement log |
| GET | /low-stock | Yes | Ecom Staff+ | Products below lowStockLimit |

**Stock in/out/adjust body:** `{ productId, quantity, reason, reference? }`

---

## Cart (`/api/cart`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | Yes | Customer | Get cart |
| POST | /items | Yes | Customer | Add item `{ productId, quantity }` |
| PUT | /items/:productId | Yes | Customer | Update quantity |
| DELETE | /items/:productId | Yes | Customer | Remove item |
| POST | /items/:productId/save-for-later | Yes | Customer | Toggle save for later |
| DELETE | / | Yes | Customer | Clear cart |

---

## Orders (`/api/orders`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | / | Yes | Customer | Create order from cart |
| GET | / | Yes | — | Admin: all orders; Customer: own orders |
| GET | /:id | Yes | — | Get order details |
| PUT | /:id/status | Yes | Ecom Staff+ | Update status (new→confirmed→packing→dispatched→delivered→cancelled→returned) |
| PUT | /:id/courier | Yes | Ecom Staff+ | Add courier tracking info |
| GET | /:id/tracking | No | — | Public tracking by order number |

**Query params for GET /:** `status`, `dateFrom`, `dateTo`, `customer`, `page`, `limit`

---

## Billing / POS (`/api/billing`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | /invoice | Yes | Billing Staff+ | Create invoice (retail/wholesale) |
| GET | /invoices | Yes | Billing Staff+ | List invoices |
| GET | /invoices/:id | Yes | Billing Staff+ | Single invoice |
| GET | /invoices/:id/print | Yes | Billing Staff+ | Print-optimized invoice data |
| GET | /search/product | Yes | Billing Staff+ | Search products by barcode/code/name `?q=` |

---

## Payments (`/api/payments`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | / | Yes | Billing Staff+ | Record payment |
| GET | / | Yes | Billing Staff+ | Payment history |
| GET | /:id | Yes | Billing Staff+ | Single payment |
| PUT | /:id | Yes | Billing Staff+ | Update payment status |

---

## Customers (`/api/customers`) — Admin

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | Yes | Any staff | Search customers `?q=&type=&page=&limit=` |
| GET | /:id | Yes | Any staff | Customer profile + stats |
| GET | /:id/orders | Yes | Any staff | Customer order history |
| PUT | /:id | Yes | Any staff | Update customer notes, credit limit |

---

## Couriers (`/api/couriers`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | Yes | Ecom Staff+ | List courier entries |
| POST | / | Yes | Ecom Staff+ | Create courier record |
| PUT | /:id | Yes | Ecom Staff+ | Update |
| DELETE | /:id | Yes | Super Admin | Delete |

---

## Homepage CMS (`/api/cms`)

### Sliders
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | /sliders | No | — (active only) |
| GET | /sliders/all | Yes | Ecom Staff+ |
| POST | /sliders | Yes | Ecom Staff+ |
| PUT | /sliders/:id | Yes | Ecom Staff+ |
| DELETE | /sliders/:id | Yes | Ecom Staff+ |
| PUT | /sliders/reorder | Yes | Ecom Staff+ | `{ items: [{id, displayOrder}] }` |

### Banners
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | /banners | No | — (active only) |
| POST | /banners | Yes | Ecom Staff+ |
| PUT | /banners/:id | Yes | Ecom Staff+ |
| DELETE | /banners/:id | Yes | Ecom Staff+ |

### Featured Products
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | /featured-products | No | — |
| POST | /featured-products | Yes | Ecom Staff+ | `{ productId, section }` |
| DELETE | /featured-products/:id | Yes | Ecom Staff+ |

---

## Settings (`/api/settings`) — Super Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | / | Get all settings |
| GET | /:key | Get single setting |
| PUT | /:key | Update setting value |
| PUT | /bulk | Update multiple settings at once |

---

## GST (`/api/gst`) — Super Admin only, feature-gated

| Method | Endpoint | Description |
|---|---|---|
| GET | /settings | Get GST settings |
| PUT | /settings | Update GST settings |
| GET | /hsn | List HSN codes |
| POST | /hsn | Create HSN code |
| PUT | /hsn/:id | Update HSN code |
| DELETE | /hsn/:id | Delete HSN code |
| GET | /reports/sales | Sales GST report `?from=&to=` |
| GET | /reports/tax-summary | Tax summary report |
| GET | /reports/hsn | HSN-wise report |

---

## Reports (`/api/reports`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | /sales | Yes | Any staff | `?period=daily|weekly|monthly|yearly&from=&to=` |
| GET | /inventory/stock | Yes | Ecom Staff+ | Current stock report |
| GET | /inventory/movement | Yes | Ecom Staff+ | Stock movement `?from=&to=&product=` |
| GET | /orders | Yes | Any staff | `?status=&from=&to=` |
| GET | /customers/top | Yes | Any staff | Top customers `?limit=10` |
| GET | /customers/purchases | Yes | Any staff | Customer purchase report `?customer=&from=&to=` |
| GET | /export/sales | Yes | Any staff | Export sales `?format=excel|pdf&from=&to=` |
| GET | /export/inventory | Yes | Ecom Staff+ | Export inventory (Excel) |

---

## Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | / | Yes | Any staff | Aggregated widgets (revenue today, revenue month, total orders, pending orders, low stock count, top products, recent activities) |

**Response shape:**
```json
{
  "revenueToday": 15000,
  "revenueThisMonth": 450000,
  "totalOrders": 342,
  "pendingOrders": 12,
  "lowStockCount": 5,
  "topProducts": [...],
  "recentActivities": [...]
}
```
