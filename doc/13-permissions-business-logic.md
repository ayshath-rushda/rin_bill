# RINBILL — Permissions, Order State Machine & Notifications

---

## 1. Granular Permission Matrix

### Permission Key Convention

```
{resource}.{action}
```
Actions: `create`, `read`, `update`, `delete`, `manage`

### Full Matrix

| Resource | super_admin | ecommerce_staff | billing_staff | customer |
|---|---|---|---|---|
| `user.create` | ✅ | ❌ | ❌ | ❌ |
| `user.read` | ✅ | ❌ | ❌ | ❌ |
| `user.update` | ✅ | ❌ | ❌ | ❌ |
| `user.delete` | ✅ | ❌ | ❌ | ❌ |
| `role.manage` | ✅ | ❌ | ❌ | ❌ |
| `product.create` | ✅ | ✅ | ❌ | ❌ |
| `product.read` | ✅ | ✅ | ❌ | ✅ |
| `product.update` | ✅ | ✅ | ❌ | ❌ |
| `product.delete` | ✅ | ✅ | ❌ | ❌ |
| `category.create` | ✅ | ✅ | ❌ | ❌ |
| `category.update` | ✅ | ✅ | ❌ | ❌ |
| `category.delete` | ✅ | ✅ | ❌ | ❌ |
| `brand.create` | ✅ | ✅ | ❌ | ❌ |
| `brand.update` | ✅ | ✅ | ❌ | ❌ |
| `brand.delete` | ✅ | ✅ | ❌ | ❌ |
| `inventory.read` | ✅ | ✅ | ❌ | ❌ |
| `inventory.create` | ✅ | ✅ | ❌ | ❌ |
| `inventory.adjust` | ✅ | ❌ | ❌ | ❌ |
| `order.read` | ✅ | ✅ | ❌ | ✅ (own) |
| `order.create` | ✅ | ❌ | ❌ | ✅ |
| `order.updateStatus` | ✅ | ✅ | ❌ | ❌ |
| `order.assignCourier` | ✅ | ✅ | ❌ | ❌ |
| `order.cancel` | ✅ | ✅ | ❌ | ✅ (own, only if new) |
| `billing.invoice.create` | ✅ | ❌ | ✅ | ❌ |
| `billing.invoice.read` | ✅ | ❌ | ✅ | ✅ (own) |
| `billing.invoice.print` | ✅ | ❌ | ✅ | ❌ |
| `billing.payment.create` | ✅ | ❌ | ✅ | ❌ |
| `billing.payment.read` | ✅ | ❌ | ✅ | ✅ (own) |
| `customer.read` | ✅ | ✅ | ✅ | ❌ |
| `customer.update` | ✅ | ✅ | ✅ | ❌ |
| `cms.slider.manage` | ✅ | ✅ | ❌ | ❌ |
| `cms.banner.manage` | ✅ | ✅ | ❌ | ❌ |
| `cms.featured.manage` | ✅ | ✅ | ❌ | ❌ |
| `report.sales` | ✅ | ✅ | ✅ | ❌ |
| `report.inventory` | ✅ | ✅ | ❌ | ❌ |
| `report.orders` | ✅ | ✅ | ✅ | ❌ |
| `report.customers` | ✅ | ✅ | ✅ | ❌ |
| `dashboard.read` | ✅ | ✅ | ✅ | ❌ |
| `settings.manage` | ✅ | ❌ | ❌ | ❌ |
| `gst.manage` | ✅ | ❌ | ❌ | ❌ |
| `gst.reports` | ✅ | ❌ | ❌ | ❌ |

### Role Definitions (Seeded Data)

```javascript
// seeds/defaultRoles.js
export const defaultRoles = [
  {
    name: 'super_admin',
    permissions: ['*'], // wildcard = all permissions
    description: 'Full system access',
  },
  {
    name: 'billing_staff',
    permissions: [
      'billing.*',
      'customer.read',
      'customer.update',
      'report.sales',
      'report.orders',
      'dashboard.read',
    ],
    description: 'POS billing, invoice generation, payment entry',
  },
  {
    name: 'ecommerce_staff',
    permissions: [
      'product.*',
      'category.*',
      'brand.*',
      'inventory.read',
      'inventory.create',
      'order.read',
      'order.updateStatus',
      'order.assignCourier',
      'cms.*',
      'report.*',
      'customer.read',
      'dashboard.read',
    ],
    description: 'Product & inventory management, order processing',
  },
  {
    name: 'customer',
    permissions: [
      'product.read',
      'order.create',
      'order.read',
      'order.cancel',
      'billing.invoice.read',
      'billing.payment.read',
    ],
    description: 'Default customer role',
  },
];
```

### RBAC Middleware Implementation

```javascript
// middleware/rbac.js
export default function rbac(...allowedPermissions) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions;

    // Super admin has '*' which matches everything
    const hasAccess = allowedPermissions.some(perm => {
      const [resource, action] = perm.split('.');
      return userPermissions.some(up => {
        if (up === '*') return true;
        if (up === `${resource}.*`) return true;
        return up === perm;
      });
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }
    next();
  };
}

// Usage in routes
router.post('/products', auth, rbac('product.create'), productController.create);
router.get('/products', auth, rbac('product.read'), productController.list);
router.put('/orders/:id/status', auth, rbac('order.updateStatus'), orderController.updateStatus);
```

---

## 2. Order Status State Machine

### Valid Transitions

```
                 ┌──────────┐
                 │   NEW    │
                 └────┬─────┘
                      │
            ┌─────────┼──────────┐
            ▼         ▼          ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │CONFIRMED │ │CANCELLED │ │ RETURNED │
      └────┬─────┘ └──────────┘ └──────────┘
           │
           ▼
      ┌──────────┐
      │ PACKING  │
      └────┬─────┘
           │
           ▼
      ┌──────────┐
      │DISPATCHED│
      └────┬─────┘
           │
      ┌────┴─────┐
      ▼          ▼
┌──────────┐ ┌──────────┐
│DELIVERED │ │ RETURNED │
└──────────┘ └──────────┘
```

### State Machine Definition

```javascript
// constants/orderStatus.js
export const ORDER_STATUSES = {
  NEW: 'new',
  CONFIRMED: 'confirmed',
  PACKING: 'packing',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

export const VALID_TRANSITIONS = {
  [ORDER_STATUSES.NEW]:        [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]:  [ORDER_STATUSES.PACKING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PACKING]:    [ORDER_STATUSES.DISPATCHED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DISPATCHED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.DELIVERED]:  [ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.CANCELLED]:  [],
  [ORDER_STATUSES.RETURNED]:   [],
};

export function isValidTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}
```

### Side Effects on Status Changes

| Transition | Side Effects |
|---|---|
| `new → confirmed` | Send confirmation email/SMS to customer |
| `any → cancelled` | Restock inventory (add cancelled quantities back), refund payment if paid, send cancellation email |
| `dispatched → delivered` | Update payment status to completed if pending, send delivery notification |
| `delivered → returned` | Restock inventory, process refund, generate credit note (if GST enabled) |

### Controller Logic

```javascript
// controllers/order.controller.js
export async function updateStatus(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }

  if (!isValidTransition(order.status, status)) {
    throw new AppError(
      `Cannot transition from '${order.status}' to '${status}'`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const oldStatus = order.status;
  order.status = status;
  await order.save();

  // Side effects
  await handleStatusSideEffects(order, oldStatus, status, req.user);

  // Audit log
  await ActivityLog.create({
    user: req.user._id,
    action: 'update',
    resource: 'order',
    resourceId: order._id,
    details: { field: 'status', from: oldStatus, to: status },
  });

  res.json({ success: true, data: order });
}

async function handleStatusSideEffects(order, oldStatus, newStatus, user) {
  if (['cancelled', 'returned'].includes(newStatus) && oldStatus !== newStatus) {
    // Restock inventory
    const orderItems = await OrderItem.find({ order: order._id });
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      await Inventory.findOneAndUpdate(
        { product: item.product },
        { $inc: { quantity: item.quantity } }
      );
    }
  }

  // Notification triggers
  if (newStatus === 'confirmed') {
    await Notification.create({
      user: order.customer,
      title: 'Order Confirmed',
      message: `Your order #${order.orderNumber} has been confirmed.`,
      type: 'success',
      link: `/account/orders/${order._id}`,
    });
  }

  if (newStatus === 'dispatched') {
    await Notification.create({
      user: order.customer,
      title: 'Order Dispatched',
      message: `Your order #${order.orderNumber} has been dispatched.`,
      type: 'info',
      link: `/account/orders/${order._id}`,
    });
  }
}
```

### Order Number Auto-Generation

```javascript
// utils/generateOrderNumber.js
export async function generateOrderNumber() {
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

  // Find the last order today and increment
  const lastOrder = await Order.findOne({
    orderNumber: { $regex: `^${prefix}` },
  }).sort({ orderNumber: -1 });

  const sequence = lastOrder
    ? parseInt(lastOrder.orderNumber.split('-')[2]) + 1
    : 1;

  return `${prefix}-${String(sequence).padStart(5, '0')}`;
}
// Example: ORD-20260620-00001
```

---

## 3. Notification System

### Notification Types & Triggers

| Trigger | Type | Recipient | Channel |
|---|---|---|---|
| Order placed | `order_placed` | Customer | In-app, Email |
| Order confirmed | `order_confirmed` | Customer | In-app, Email |
| Order dispatched | `order_dispatched` | Customer | In-app, Email, SMS |
| Order delivered | `order_delivered` | Customer | In-app |
| Order cancelled | `order_cancelled` | Customer | In-app, Email |
| Payment received | `payment_received` | Customer | In-app |
| Low stock alert | `low_stock` | Ecom Staff | In-app |
| New customer registration | `new_customer` | Admin | In-app |
| New order (admin) | `new_order_admin` | Ecom Staff | In-app |

### Notification Model

```javascript
// models/Notification.js
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['order_placed', 'order_confirmed', 'order_dispatched',
           'order_delivered', 'order_cancelled', 'payment_received',
           'low_stock', 'new_customer', 'new_order_admin', 'system'],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }, // flexible payload
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
```

### In-App Notification API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/notifications | Yes | List user's notifications (paginated) |
| GET | /api/notifications/unread-count | Yes | Count of unread |
| PUT | /api/notifications/:id/read | Yes | Mark single as read |
| PUT | /api/notifications/read-all | Yes | Mark all as read |

### Notification Service

```javascript
// services/notification.service.js
import { io } from '../app.js'; // Socket.io instance

export async function sendNotification({ user, title, message, type, link, metadata }) {
  // Save to DB
  const notification = await Notification.create({
    user, title, message, type, link, metadata,
  });

  // Real-time delivery via Socket.io
  if (io) {
    io.to(`user:${user.toString()}`).emit('notification', notification);
  }

  return notification;
}

// Usage
await sendNotification({
  user: order.customer,
  title: 'Order Confirmed 🎉',
  message: `Your order #${order.orderNumber} has been confirmed and is being processed.`,
  type: 'order_confirmed',
  link: `/account/orders/${order._id}`,
});
```

### Email Templates

| Template | Trigger | Key Variables |
|---|---|---|
| `welcome` | Registration | name, email |
| `order-confirmation` | Order placed | orderNumber, items, total, address |
| `order-shipped` | Dispatched | orderNumber, courier, tracking, ETA |
| `order-delivered` | Delivered | orderNumber |
| `password-reset` | Forgot password | OTP code, expiry |

Email rendering: Use **handlebars** or **EJS** templates stored in `backend/src/templates/emails/`.

### Real-Time Updates (Socket.io)

```javascript
// app.js — Socket.io setup
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Auth middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  // Join personal room
  socket.join(`user:${socket.userId}`);

  socket.on('disconnect', () => {
    socket.leave(`user:${socket.userId}`);
  });
});
```

### Frontend Socket.io Integration

```javascript
// hooks/useSocket.js
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

export default function useSocket() {
  const { accessToken } = useSelector(state => state.auth);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      auth: { token: accessToken },
    });

    socket.on('notification', (notification) => {
      toast(notification.title, {
        description: notification.message,
        onClick: () => notification.link && navigate(notification.link),
      });
    });

    return () => socket.disconnect();
  }, [accessToken]);
}
```
