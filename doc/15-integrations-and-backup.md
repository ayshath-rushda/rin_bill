# RINBILL — Third-Party Integrations, Seed Data & Backup

---

## 1. Third-Party Integration Patterns

### Payment Gateway Integration (Future)

Generic adapter interface to support multiple gateways:

```javascript
// services/payment/paymentAdapter.js
// All gateways implement this interface
export class PaymentGatewayAdapter {
  async createOrder(amount, currency) { throw new Error('Not implemented'); }
  async verifyPayment(paymentId, orderId) { throw new Error('Not implemented'); }
  async processRefund(transactionId, amount) { throw new Error('Not implemented'); }
}
```

#### Razorpay Integration

```javascript
// services/payment/razorpay.js
import Razorpay from 'razorpay';
import crypto from 'crypto';

export class RazorpayAdapter extends PaymentGatewayAdapter {
  constructor() {
    super();
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(amount, currency = 'INR') {
    const order = await this.client.orders.create({
      amount: amount * 100, // paise
      currency,
      receipt: `rcpt_${Date.now()}`,
    });
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  }

  async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpay_signature;
  }

  async processRefund(transactionId, amount) {
    const refund = await this.client.payments.refund(transactionId, {
      amount: amount * 100,
    });
    return { id: refund.id, status: refund.status };
  }
}

// Usage
const gateway = new RazorpayAdapter();
```

#### PhonePe / Paytm Integration (Future)

Follow same adapter pattern. Each gateway's specific SDK calls are encapsulated in its own class. The controller only calls the interface:

```javascript
// controllers/payment.controller.js
export async function initiatePayment(req, res) {
  const { orderId, method } = req.body;
  const order = await Order.findById(orderId);

  const gateway = getPaymentGateway(method); // factory function
  const paymentOrder = await gateway.createOrder(order.total, 'INR');

  // Save payment record
  await Payment.create({
    invoice: order.invoice,
    amount: order.total,
    method,
    transactionRef: paymentOrder.id,
    status: 'pending',
  });

  res.json({ success: true, data: paymentOrder });
}
```

### SMS Integration (Future)

```javascript
// services/sms.service.js
export async function sendSMS(phone, message) {
  // Twilio
  // const twilio = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({ body: message, from: TWILIO_PHONE, to: phone });

  // Or MSG91 / Fast2SMS
  // const res = await axios.post('https://api.msg91.com/api/sendhttp.php', {
  //   authkey: MSG91_AUTH_KEY,
  //   mobiles: phone,
  //   message,
  //   sender: 'RINBIL',
  //   route: '4',
  // });
}
```

### Email Template Rendering

```javascript
// config/email.js
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Template cache
const templates = new Map();

function loadTemplate(name) {
  if (!templates.has(name)) {
    const filePath = path.join('src/templates/emails', `${name}.hbs`);
    const source = fs.readFileSync(filePath, 'utf8');
    templates.set(name, handlebars.compile(source));
  }
  return templates.get(name);
}

export async function sendEmail({ to, subject, template, context }) {
  const compiled = loadTemplate(template);
  const html = compiled(context);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

// Usage
await sendEmail({
  to: user.email,
  subject: `Order #${order.orderNumber} Confirmed`,
  template: 'order-confirmation',
  context: {
    name: user.name,
    orderNumber: order.orderNumber,
    items: order.items,
    total: order.total,
    address: order.shippingAddress,
  },
});
```

### Email Templates Directory

```
backend/src/templates/emails/
├── welcome.hbs
├── order-confirmation.hbs
├── order-shipped.hbs
├── order-delivered.hbs
├── password-reset.hbs
└── invoice.hbs
```

### Template Example (`order-confirmation.hbs`)

```handlebars
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hi {{name}},</h2>
  <p>Your order <strong>#{{orderNumber}}</strong> has been confirmed!</p>

  <h3>Order Summary</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="border-bottom: 1px solid #eee;">
      <th style="text-align: left; padding: 8px;">Item</th>
      <th style="text-align: center; padding: 8px;">Qty</th>
      <th style="text-align: right; padding: 8px;">Price</th>
    </tr>
    {{#each items}}
    <tr>
      <td style="padding: 8px;">{{this.productName}}</td>
      <td style="text-align: center; padding: 8px;">{{this.quantity}}</td>
      <td style="text-align: right; padding: 8px;">₹{{this.total}}</td>
    </tr>
    {{/each}}
  </table>

  <p style="text-align: right; font-size: 1.2em;"><strong>Total: ₹{{total}}</strong></p>

  <p>Shipping to: {{address.line1}}, {{address.city}}, {{address.state}}</p>

  <p>Track your order: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>

  <p>Thanks for shopping with RINBILL!</p>
</body>
</html>
```

---

## 2. Seed Data Strategy

### Seed Script Structure

```
backend/seeds/
├── index.js                 # Master seed runner
├── roles.seed.js            # Default roles
├── admin.seed.js            # Super admin user
├── settings.seed.js         # Default settings/feature flags
├── categories.seed.js       # Sample categories
├── brands.seed.js           # Sample brands
├── products.seed.js         # Sample products
├── customers.seed.js        # Sample customer accounts
├── orders.seed.js           # Sample orders
└── development.seed.js      # Only in dev: large sample dataset
```

### Master Seed Runner

```javascript
// seeds/index.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import seedRoles from './roles.seed.js';
import seedAdmin from './admin.seed.js';
import seedSettings from './settings.seed.js';
import seedCategories from './categories.seed.js';
import seedBrands from './brands.seed.js';

async function runSeed() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`🌱 Seeding for ${env} environment...`);

  await mongoose.connect(process.env.MONGODB_URI);

  const order = [
    seedRoles,
    seedAdmin,
    seedSettings,
    seedCategories,
    seedBrands,
  ];

  if (env === 'development') {
    const devSeed = await import('./development.seed.js');
    order.push(devSeed.default);
  }

  for (const seed of order) {
    try {
      const result = await seed();
      console.log(`  ✅ ${result}`);
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  console.log('🌱 Seeding complete!');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed();
```

### Individual Seed Example

```javascript
// seeds/roles.seed.js
import Role from '../src/models/Role.js';

export default async function seedRoles() {
  const roles = [
    {
      name: 'super_admin',
      permissions: ['*'],
      description: 'Full system access',
    },
    {
      name: 'billing_staff',
      permissions: [
        'billing.*', 'customer.read', 'customer.update',
        'report.sales', 'report.orders', 'dashboard.read',
      ],
      description: 'POS billing & invoice generation',
    },
    {
      name: 'ecommerce_staff',
      permissions: [
        'product.*', 'category.*', 'brand.*',
        'inventory.read', 'inventory.create',
        'order.read', 'order.updateStatus', 'order.assignCourier',
        'cms.*', 'report.*', 'customer.read', 'dashboard.read',
      ],
      description: 'Product & inventory management, order processing',
    },
    {
      name: 'customer',
      permissions: [
        'product.read', 'order.create', 'order.read',
        'order.cancel', 'billing.invoice.read', 'billing.payment.read',
      ],
      description: 'Default customer role',
    },
  ];

  for (const role of roles) {
    await Role.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }

  return `${roles.length} roles seeded`;
}

// seeds/admin.seed.js
export default async function seedAdmin() {
  const bcrypt = (await import('bcryptjs')).default;
  const User = (await import('../src/models/User.js')).default;
  const Role = (await import('../src/models/Role.js')).default;

  const adminRole = await Role.findOne({ name: 'super_admin' });
  if (!adminRole) throw new Error('Admin role not found — run roles seed first');

  const existing = await User.findOne({ email: 'admin@rinbill.com' });
  if (existing) return 'Admin user already exists';

  await User.create({
    name: 'Super Admin',
    email: 'admin@rinbill.com',
    password: 'Admin@123',
    role: adminRole._id,
    isVerified: true,
    isActive: true,
  });

  return 'Admin user created (admin@rinbill.com / Admin@123)';
}

// seeds/settings.seed.js
export default async function seedSettings() {
  const Setting = (await import('../src/models/Setting.js')).default;

  const defaults = [
    { key: 'gstEnabled', value: false },
    { key: 'multiWarehouse', value: false },
    { key: 'multiBranch', value: false },
    { key: 'purchaseManagement', value: false },
  ];

  for (const setting of defaults) {
    await Setting.findOneAndUpdate(
      { key: setting.key },
      setting,
      { upsert: true, new: true }
    );
  }

  return `${defaults.length} settings seeded`;
}
```

### Seed Command

```json
// backend/package.json
"scripts": {
  "seed": "node seeds/index.js",
  "seed:dev": "NODE_ENV=development node seeds/index.js",
  "seed:prod": "NODE_ENV=production node seeds/index.js"
}
```

---

## 3. Backup & Disaster Recovery

### MongoDB Backup Strategy

| Frequency | Type | Retention | Storage |
|---|---|---|---|
| Daily | `mongodump` full backup | 30 days | Local + S3 |
| Hourly | Oplog incremental (if needed) | 24 hours | Local |
| Weekly | Compressed archive | 3 months | S3/Glacier |

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups/rinbill"
DB_NAME="rinbill"
DATE=$(date +%Y-%m-%d-%H%M)
FILENAME="rinbill-$DATE.gz"
S3_BUCKET="s3://rinbill-backups"

# Create backup
mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/$FILENAME"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$FILENAME" "$S3_BUCKET/daily/"

# Cleanup local backups older than 7 days
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

# Verify backup integrity
mongorestore --dry-run --gzip --archive="$BACKUP_DIR/$FILENAME" 2>&1 | head -5
```

### Restore Procedure

```bash
# Restore latest backup
mongorestore --uri="$MONGODB_URI" --gzip --archive="/backups/rinbill/rinbill-2026-06-20-0300.gz"

# Restore from specific S3 backup
aws s3 cp "s3://rinbill-backups/daily/rinbill-2026-06-19-0300.gz" /tmp/
mongorestore --uri="$MONGODB_URI" --gzip --archive="/tmp/rinbill-2026-06-19-0300.gz"

# Drop existing collections before restore (if needed)
mongorestore --drop --uri="$MONGODB_URI" --gzip --archive="..."
```

### Cloudinary Backup

- Enable **Automatic Backup** in Cloudinary Settings → Backups
- Choose destination: AWS S3, Google Cloud Storage, or Azure
- Frequency: Daily
- Creates a ZIP of all assets with metadata JSON

### Disaster Recovery Plan

| Scenario | RPO | RTO | Action |
|---|---|---|---|
| Single document deleted | — | 5 min | Restore from oplog or daily backup |
| Server crash | 1 hour | 30 min | Spin up new VPS, restore latest backup, update DNS |
| DB corruption | 24 hours | 2 hours | Restore from S3 backup |
| Full region outage | 24 hours | 4 hours | Deploy to secondary region, restore from S3 |
| Accidental deployment | — | 15 min | Rollback to previous Docker image tag |

### Cron Jobs

```bash
# crontab -e
# Daily DB backup at 3 AM
0 3 * * * /opt/rinbill/scripts/backup.sh >> /var/log/backup.log 2>&1

# Health check every 5 minutes
*/5 * * * * curl -f http://localhost:5000/health || pm2 restart rinbill-api

# SSL renewal (Let's Encrypt)
0 0 1 * * certbot renew --quiet && nginx -s reload

# Log rotation
0 0 * * 0 logrotate /etc/logrotate.d/rinbill
```

### Log Rotate Config

```
/opt/rinbill/backend/logs/*.log {
  daily
  rotate 30
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
}
```
