import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      enum: ['super_admin', 'billing_staff', 'ecommerce_staff', 'customer'],
      lowercase: true,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);
