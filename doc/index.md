# RINBILL — Project Documentation

> Integrated E-Commerce, Inventory, Billing & Management System

---

## Document Map

### Core Architecture & Design

| # | File | Description |
|---|---|---|
| 1 | [01-system-architecture.md](./01-system-architecture.md) | Tech stack, folder structure, architecture diagram, key decisions |
| 2 | [02-database-schema.md](./02-database-schema.md) | All 26 MongoDB collections with field definitions |
| 3 | [03-api-endpoints.md](./03-api-endpoints.md) | Full REST API reference (100+ endpoints, method, auth, role) |
| 4 | [04-frontend-routes.md](./04-frontend-routes.md) | Customer website + admin portal routes, guards, component trees |
| 5 | [05-development-phases.md](./05-development-phases.md) | 12-phase implementation plan with tasks, deliverables, dependency graph |
| 6 | [06-security-state-management.md](./06-security-state-management.md) | JWT auth flow, middleware pipeline, Redux + React Query strategy |
| 7 | [07-feature-toggles-and-gst.md](./07-feature-toggles-and-gst.md) | Feature flag system, hidden GST module implementation |

### Module Deep-Dives

| # | File | Description |
|---|---|---|
| 8 | [08-pos-billing-system.md](./08-pos-billing-system.md) | POS billing UI mockup, keyboard shortcuts, invoice print format |
| 9 | [13-permissions-business-logic.md](./13-permissions-business-logic.md) | Full permission matrix (resource × role), order state machine, notification system |

### Standards & Conventions

| # | File | Description |
|---|---|---|
| 10 | [10-error-handling-and-api-standards.md](./10-error-handling-and-api-standards.md) | Error envelope, status codes, validation (Joi), pagination standard, frontend error boundaries |
| 11 | [14-code-conventions-and-database.md](./14-code-conventions-and-database.md) | Naming, imports, ESLint/Prettier, component style, DB indexes, aggregation pipelines, search, file upload, caching |

### Quality Assurance

| # | File | Description |
|---|---|---|
| 12 | [11-testing-strategy.md](./11-testing-strategy.md) | Test pyramid, directory structure, factories, integration tests, frontend tests, E2E |

### DevOps & Operations

| # | File | Description |
|---|---|---|
| 13 | [12-deployment-and-devops.md](./12-deployment-and-devops.md) | Docker, docker-compose, nginx, PM2, CI/CD, hosting, MongoDB Atlas, SSL, monitoring, deployment checklist |

### Data & Integrations

| # | File | Description |
|---|---|---|
| 14 | [15-integrations-and-backup.md](./15-integrations-and-backup.md) | Payment gateway adapter, SMS, email templates (Handlebars), seed data scripts, MongoDB backup/restore, DR plan |

### Reference

| # | File | Description |
|---|---|---|
| 15 | [09-dependencies-and-env.md](./09-dependencies-and-env.md) | Package.json (frontend + backend), shadcn components, `.env` templates |
| 16 | [16-fulfillment-check.md](./16-fulfillment-check.md) | Cross-reference: OVERVIEW.md requirements → doc coverage |

---

## Quick Reference

### User Roles & Permissions

| Role | Permissions |
|---|---|
| Super Admin | Full system access, GST, settings, user management |
| Billing Staff | Billing, invoice generation, payment entry, customer lookup |
| Ecommerce Staff | Products, inventory, orders, CMS, reports |
| Customer | Browse, purchase, track orders, manage profile |

### Development Phases Summary

| Phase | Days | Focus |
|---|---|---|
| 1 | 3-5 | Auth + Roles |
| 2 | 4-6 | Product Management |
| 3 | 3-4 | Inventory Management |
| 4 | 2-3 | Homepage CMS |
| 5 | 4-5 | Customer Website |
| 6 | 3-4 | Cart & Checkout |
| 7 | 3-4 | Order Management |
| 8 | 4-5 | Billing System |
| 9 | 3-4 | Reporting |
| 10 | 3-4 | Hidden GST Module |
| 11 | 2-3 | Dashboard |
| 12 | 3-4 | Testing & Deployment |
| **Total** | **40-52** | |

### State Management

| Concern | Tool |
|---|---|
| Auth, Cart, UI, Settings | Redux Toolkit |
| Products, Orders, Reports, CMS | React Query |

### Key Backend Middleware Stack

```
Rate Limiter → CORS → Helmet → Morgan → Auth → RBAC → Validate → Controller → Audit Log
```

### Quick Nav by Concern

| I need... | Go to... |
|---|---|
| API endpoint list | `03-api-endpoints.md` |
| DB schema for Model X | `02-database-schema.md` |
| What pages/routes to create | `04-frontend-routes.md` |
| What to implement first | `05-development-phases.md` |
| How auth works | `06-security-state-management.md` |
| Error response format | `10-error-handling-and-api-standards.md` |
| Permission per role | `13-permissions-business-logic.md` |
| Order status flow | `13-permissions-business-logic.md` |
| How to write tests | `11-testing-strategy.md` |
| How to deploy | `12-deployment-and-devops.md` |
| Code style guide | `14-code-conventions-and-database.md` |
| Cloudinary setup | `14-code-conventions-and-database.md` |
| GST implementation | `07-feature-toggles-and-gst.md` |
| NPM packages needed | `09-dependencies-and-env.md` |

---

## Requirements Fulfillment

All 19 requirements from `OVERVIEW.md` are documented (see `16-fulfillment-check.md` for the full cross-reference).
