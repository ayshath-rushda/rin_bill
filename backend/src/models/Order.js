import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
      },
    ],
    addressSnapshot: {
      label: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['new', 'confirmed', 'packing', 'dispatched', 'delivered', 'cancelled', 'returned'],
      default: 'new',
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

export default mongoose.model('Order', orderSchema);
