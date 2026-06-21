import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['stock_in', 'stock_out', 'adjustment'],
      required: [true, 'Transaction type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be positive'],
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: 200,
    },
    reference: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
  },
  { timestamps: true }
);

stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1, createdAt: -1 });
stockTransactionSchema.index({ createdAt: -1 });

export default mongoose.model('StockTransaction', stockTransactionSchema);
