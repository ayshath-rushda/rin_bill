# RINBILL — Database Schema (26 Collections)

All schemas use MongoDB + Mongoose with `timestamps: true` unless noted.

---

## users

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| password | String | required, bcrypt hashed |
| role | ObjectId | ref: `roles` |
| phone | String | |
| avatar | String | Cloudinary URL |
| isActive | Boolean | default: true |
| isVerified | Boolean | default: false |
| refreshToken | String | hashed |
| resetPasswordOTP | String | |
| resetPasswordExpires | Date | |
| createdAt / updatedAt | Date | auto (timestamps) |

Indexes: `email` (unique), `role`

---

## roles

| Field | Type | Notes |
|---|---|---|
| name | String | unique (super_admin, billing_staff, ecommerce_staff, customer) |
| permissions | [String] | Array of permission keys |
| description | String | |

Seeded defaults: super_admin (all permissions), billing_staff (billing.*), ecommerce_staff (product.*, inventory.*, order.*), customer (account.*, order.view)

---

## categories

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| slug | String | required, unique, auto-generated |
| image | String | Cloudinary URL |
| description | String | |
| isActive | Boolean | default: true |

---

## brands

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| logo | String | Cloudinary URL |
| description | String | |

---

## products

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| code | String | unique, auto-generated product code |
| sku | String | unique |
| category | ObjectId | ref: `categories` |
| brand | ObjectId | ref: `brands` |
| vehicleCompatibility | [String] | |
| description | String | rich text |
| shortDescription | String | |
| images | [String] | Cloudinary URLs (main images) |
| galleryImages | [String] | Cloudinary URLs |
| sellingPrice | Number | required |
| costPrice | Number | |
| stock | Number | default: 0 |
| lowStockLimit | Number | default: 5 |
| weight | Number | grams/kg |
| status | String | enum: active, inactive, draft |
| hsnCode | String | hidden when GST disabled |
| gstRate | Number | hidden when GST disabled |
| isFeatured | Boolean | |
| isBestSeller | Boolean | |
| isNewArrival | Boolean | |

Indexes: `code` (unique), `sku` (unique), `category`, `brand`, `name` (text), `status`

---

## inventory

| Field | Type | Notes |
|---|---|---|
| product | ObjectId | ref: `products`, unique |
| quantity | Number | current stock count |

---

## stockTransactions

| Field | Type | Notes |
|---|---|---|
| product | ObjectId | ref: `products` |
| type | String | enum: in, out, adjustment |
| quantity | Number | positive for in, negative for out |
| previousStock | Number | |
| newStock | Number | |
| reason | String | |
| reference | String | order number, adjustment note |
| user | ObjectId | ref: `users` (who performed) |

Indexes: `product`, `createdAt`, `type`

---

## customers

| Field | Type | Notes |
|---|---|---|
| user | ObjectId | ref: `users`, unique |
| type | String | enum: retail, wholesale |
| totalOrders | Number | default: 0 |
| totalSpend | Number | default: 0 |
| creditLimit | Number | for wholesale B2B |
| notes | String | |

---

## addresses

| Field | Type | Notes |
|---|---|---|
| user | ObjectId | ref: `users` |
| label | String | Home, Office, etc. |
| line1 | String | required |
| line2 | String | |
| city | String | required |
| state | String | required |
| pincode | String | required |
| phone | String | |
| isDefault | Boolean | default: false |

---

## orders

| Field | Type | Notes |
|---|---|---|
| orderNumber | String | unique, auto-generated |
| customer | ObjectId | ref: `users` |
| items | [ObjectId] | ref: `orderItems` |
| subtotal | Number | |
| discount | Number | |
| tax | Number | |
| total | Number | |
| status | String | enum: new, confirmed, packing, dispatched, delivered, cancelled, returned |
| shippingAddress | ObjectId | ref: `addresses` |
| paymentMethod | String | enum: cash, upi, bank_transfer |
| notes | String | |
| createdBy | ObjectId | ref: `users` (admin if POS) |

Indexes: `orderNumber` (unique), `customer`, `status`, `createdAt`

---

## orderItems

| Field | Type | Notes |
|---|---|---|
| order | ObjectId | ref: `orders` |
| product | ObjectId | ref: `products` |
| productName | String | snapshot |
| quantity | Number | |
| price | Number | unit price at time of order |
| total | Number | quantity * price |

---

## cart

| Field | Type | Notes |
|---|---|---|
| user | ObjectId | ref: `users`, unique |
| items | [CartItem] | embedded subdocuments |

CartItem subdocument:

| Field | Type |
|---|---|
| product | ObjectId (ref: products) |
| quantity | Number |
| savedForLater | Boolean (default: false) |

---

## payments

| Field | Type | Notes |
|---|---|---|
| invoice | ObjectId | ref: `invoices` |
| amount | Number | |
| method | String | enum: cash, upi, bank_transfer |
| transactionRef | String | |
| status | String | enum: pending, completed, failed, refunded |
| date | Date | |

---

## invoices

| Field | Type | Notes |
|---|---|---|
| invoiceNumber | String | unique, auto-generated |
| order | ObjectId | ref: `orders` (nullable for POS) |
| customer | ObjectId | ref: `users` |
| customerName | String | snapshot |
| items | [InvoiceItem] | embedded |
| subtotal | Number | |
| discount | Number | |
| tax | Number | |
| total | Number | |
| amountPaid | Number | |
| balance | Number | |
| type | String | enum: retail, wholesale |
| gstDetails | Object | { cgst, sgst, igst, invoiceValue } |

---

## couriers

| Field | Type | Notes |
|---|---|---|
| order | ObjectId | ref: `orders` |
| courierName | String | |
| trackingNumber | String | |
| dispatchDate | Date | |
| estimatedDelivery | Date | |
| actualDelivery | Date | |

---

## sliders

| Field | Type | Notes |
|---|---|---|
| title | String | |
| subtitle | String | |
| description | String | |
| buttonText | String | |
| buttonUrl | String | |
| bannerImage | String | Cloudinary URL |
| displayOrder | Number | |
| isActive | Boolean | |
| startDate | Date | scheduling |
| endDate | Date | scheduling |

---

## banners

| Field | Type | Notes |
|---|---|---|
| title | String | |
| image | String | Cloudinary URL |
| url | String | link |
| position | String | enum: top, middle, bottom |
| isActive | Boolean | |

---

## featuredProducts

| Field | Type | Notes |
|---|---|---|
| product | ObjectId | ref: `products` |
| section | String | enum: featured, best_seller, new_arrival |
| displayOrder | Number | |

---

## settings

| Field | Type | Notes |
|---|---|---|
| key | String | unique |
| value | Mixed | can be boolean, string, number, object |

Predefined keys: `gstEnabled`, `multiWarehouse`, `multiBranch`, `purchaseManagement`

---

## gstSettings

| Field | Type | Notes |
|---|---|---|
| businessGstin | String | |
| businessName | String | |
| stateCode | String | |
| address | String | |

---

## hsnCodes

| Field | Type | Notes |
|---|---|---|
| hsnCode | String | unique |
| description | String | |
| gstRate | Number | enum: 0, 5, 12, 18, 28 |
| compensationCess | Number | |

---

## gstInvoices

| Field | Type | Notes |
|---|---|---|
| invoice | ObjectId | ref: `invoices` |
| cgst | Number | |
| sgst | Number | |
| igst | Number | |
| totalTax | Number | |
| taxableValue | Number | |
| hsnSummary | [Object] | { hsnCode, rate, taxableValue, taxAmount } |

---

## gstReports

| Field | Type | Notes |
|---|---|---|
| period | String | monthly, quarterly, yearly |
| periodStart | Date | |
| periodEnd | Date | |
| type | String | enum: sales, purchase, hsn |
| data | Mixed | aggregated report data |

---

## notifications

| Field | Type | Notes |
|---|---|---|
| user | ObjectId | ref: `users` |
| title | String | |
| message | String | |
| type | String | enum: info, warning, success, error |
| isRead | Boolean | default: false |
| link | String | optional deep link |

---

## activityLogs

| Field | Type | Notes |
|---|---|---|
| user | ObjectId | ref: `users` |
| action | String | enum: create, update, delete, login, logout |
| resource | String | resource name (product, order, etc.) |
| resourceId | ObjectId | |
| details | Mixed | changed fields, values |
| ip | String | |
| userAgent | String | |

---

## wishlist

| Field | Type | Notes |
|---|---|---|
| user | ObjectId | ref: `users`, unique |
| products | [ObjectId] | ref: `products` |
