import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer'],
      required: true,
    },
    transactionRef: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ invoice: 1 });
paymentSchema.index({ date: -1 });

export default mongoose.model('Payment', paymentSchema);
