# RINBILL — System Architecture

## Overview
Integrated E-Commerce, Inventory, Billing & Management System supporting Retail (B2C) and Wholesale (B2B) operations.

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js (Vite) | UI framework |
| Tailwind CSS | Styling |
| Shadcn UI | Component library |
| Redux Toolkit | Global state (auth, cart, UI, settings) |
| React Query | Server state caching (products, orders, reports) |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Charts for reports/dashboard |
| react-hot-toast | Notifications |
| lucide-react | Icons |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Mongoose | MongoDB ODM |
| Cloudinary SDK | Image uploads |
| Joi | Input validation |
| helmet, cors, morgan | Security & logging |
| express-rate-limit | Rate limiting |
| pdfkit / exceljs | Export (PDF/Excel) |

### Database
| Technology | Purpose |
|---|---|
| MongoDB | Primary database |
| Mongoose | Schema modeling |

### Storage
| Technology | Purpose |
|---|---|
| Cloudinary | Product images, banners, slider images |

---

## Folder Structure

```
rin_bill/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # MongoDB connection
│   │   │   ├── cloudinary.js          # Cloudinary config
│   │   │   ├── email.js               # Nodemailer setup
│   │   │   └── constants.js           # Enums, defaults
│   │   │
│   │   ├── models/                    # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Role.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── Brand.js
│   │   │   ├── Inventory.js
│   │   │   ├── StockTransaction.js
│   │   │   ├── Customer.js
│   │   │   ├── Address.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── Cart.js
│   │   │   ├── Payment.js
│   │   │   ├── Invoice.js
│   │   │   ├── Courier.js
│   │   │   ├── Slider.js
│   │   │   ├── Banner.js
│   │   │   ├── FeaturedProduct.js
│   │   │   ├── Setting.js
│   │   │   ├── GstSetting.js
│   │   │   ├── HsnCode.js
│   │   │   ├── GstInvoice.js
│   │   │   ├── Notification.js
│   │   │   ├── ActivityLog.js
│   │   │   └── Wishlist.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification
│   │   │   ├── rbac.js                # Role-based access
│   │   │   ├── validate.js            # Joi schema validation
│   │   │   ├── rateLimiter.js         # Rate limit config
│   │   │   ├── gstGuard.js            # Feature flag guard
│   │   │   ├── errorHandler.js        # Global error handler
│   │   │   └── auditLog.js            # Activity logging
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── brand.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── billing.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── customer.routes.js
│   │   │   ├── courier.routes.js
│   │   │   ├── cms.routes.js
│   │   │   ├── report.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── setting.routes.js
│   │   │   └── gst.routes.js          # Conditionally registered
│   │   │
│   │   ├── controllers/               # One per route file
│   │   ├── services/                  # Business logic layer
│   │   ├── validators/                # Joi schemas per resource
│   │   └── app.js                     # Express app setup
│   │
│   ├── seeds/
│   │   ├── defaultRoles.js
│   │   ├── adminUser.js
│   │   └── defaultSettings.js
│   │
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js               # Axios instance (interceptors)
│   │   │   ├── auth.api.js
│   │   │   ├── product.api.js
│   │   │   ├── order.api.js
│   │   │   ├── cart.api.js
│   │   │   ├── cms.api.js
│   │   │   ├── report.api.js
│   │   │   ├── billing.api.js
│   │   │   ├── dashboard.api.js
│   │   │   ├── setting.api.js
│   │   │   └── gst.api.js
│   │   │
│   │   ├── components/                # Shared shadcn + custom
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── DataTable.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── ...
│   │   │
│   │   ├── features/
│   │   │   ├── authSlice.js
│   │   │   ├── cartSlice.js
│   │   │   ├── uiSlice.js
│   │   │   └── settingsSlice.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   ├── useDebounce.js
│   │   │   ├── useRoleAccess.js
│   │   │   └── useSettings.js
│   │   │
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx        # Sidebar + header
│   │   │   ├── CustomerLayout.jsx     # Navbar + footer
│   │   │   └── AuthLayout.jsx         # Login/register pages
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── brands/
│   │   │   │   ├── inventory/
│   │   │   │   ├── orders/
│   │   │   │   ├── customers/
│   │   │   │   ├── billing/
│   │   │   │   ├── cms/
│   │   │   │   ├── reports/
│   │   │   │   ├── users/
│   │   │   │   ├── settings/
│   │   │   │   └── gst/               # Hidden, no sidebar link
│   │   │   │
│   │   │   └── customer/
│   │   │       ├── Home.jsx
│   │   │       ├── ProductListing.jsx
│   │   │       ├── ProductDetail.jsx
│   │   │       ├── Cart.jsx
│   │   │       ├── Checkout.jsx
│   │   │       ├── auth/              # Login, Register, ForgotPassword
│   │   │       └── account/           # Profile, Addresses, Orders, Wishlist
│   │   │
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx          # Route composition
│   │   │   ├── ProtectedRoute.jsx     # Auth guard
│   │   │   ├── AdminRoute.jsx         # Role + auth guard
│   │   │   └── GstRoute.jsx           # Feature flag + Super Admin guard
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.js          # Currency, date, number
│   │   │   ├── constants.js           # Enums, order statuses, etc.
│   │   │   └── validators.js          # Client-side validation
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── components.json                # shadcn config
│
└── OVERVIEW.md
```

---

## Application Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Customer Browser                   │
│  ┌─────────────────┐    ┌─────────────────────┐    │
│  │ Customer Website │    │    Admin Portal      │    │
│  │  (e-commerce)    │    │  (management panel)  │    │
│  └────────┬─────────┘    └──────────┬──────────┘    │
│           │                         │                │
└───────────┼─────────────────────────┼────────────────┘
            │                         │
            ▼                         ▼
     ┌───────────────────────────────────┐
     │        Axios HTTP Client           │
     │   (interceptors: JWT, refresh)     │
     └───────────────┬───────────────────┘
                     │
                     ▼
     ┌───────────────────────────────────┐
     │     Express.js REST API Server     │
     │                                    │
     │  Rate Limiter → CORS → Helmet      │
     │       → Auth → RBAC → Controller   │
     │                                    │
     │  GST routes conditionally mounted  │
     └───────────────┬───────────────────┘
                     │
                     ▼
     ┌───────────────────────────────────┐
     │      MongoDB (Mongoose ODM)        │
     │      + Cloudinary (images)         │
     └───────────────────────────────────┘
```

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Redux for global state, React Query for server state** | Redux handles persistent client state (auth, cart); React Query handles caching, refetching, and pagination of API data |
| **Feature flag system** | GST and future modules controlled via DB settings, no redeployment needed |
| **Conditional route registration** | Backend mounts GST routes only when `gstEnabled=true`; frontend hides GST routes from sidebar |
| **JWT access + refresh tokens** | Short-lived access tokens (15m) with httpOnly refresh tokens (7d) for security |
| **Service layer** | Keeps controllers thin; business logic lives in `services/` for testability |
| **Audit logging middleware** | Logs all CUD operations to `activityLogs` for traceability |
