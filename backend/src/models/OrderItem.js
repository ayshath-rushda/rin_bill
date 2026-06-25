import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSnapshot: {
      name: String,
      price: Number,
      image: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });

export default mongoose.model('OrderItem', orderItemSchema);
