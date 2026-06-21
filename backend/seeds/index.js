import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Role from '../src/models/Role.js';
import User from '../src/models/User.js';
import connectDB from '../src/config/db.js';

const defaultRoles = [
  {
    name: 'super_admin',
    permissions: ['*'],
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

const defaultSettings = [
  { key: 'gstEnabled', value: false },
  { key: 'multiWarehouse', value: false },
  { key: 'multiBranch', value: false },
  { key: 'purchaseManagement', value: false },
];

const seed = async () => {
  try {
    await connectDB();

    console.log('Seeding roles...');
    for (const roleData of defaultRoles) {
      await Role.findOneAndUpdate(
        { name: roleData.name },
        { $setOnInsert: roleData },
        { upsert: true, new: true }
      );
    }
    console.log('Roles seeded');

    console.log('Seeding settings...');
    const Setting = mongoose.model('Setting', new mongoose.Schema({
      key: { type: String, unique: true },
      value: { type: mongoose.Schema.Types.Mixed },
    }));
    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true, new: true }
      );
    }
    console.log('Settings seeded');

    console.log('Seeding super admin...');
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    const existingAdmin = await User.findOne({ email: 'admin@rinbill.com' });

    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@rinbill.com',
        password: 'Admin@123',
        role: superAdminRole._id,
        isVerified: true,
      });
      console.log('Super admin created: admin@rinbill.com / Admin@123');
    } else {
      console.log('Super admin already exists');
    }

    console.log('Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
