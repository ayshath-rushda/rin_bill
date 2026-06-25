import mongoose from 'mongoose';

const courierSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    courierName: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dispatchDate: Date,
    estimatedDelivery: Date,
    actualDelivery: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Courier', courierSchema);
