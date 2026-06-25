import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productSnapshot: {
      name: String,
      code: String,
      image: String,
      hsnCode: String,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    gstRate: Number,
    gstAmount: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerSnapshot: {
      name: String,
      phone: String,
      email: String,
      gstin: String,
      address: String,
    },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['retail', 'wholesale'],
      default: 'retail',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'partial', 'cancelled'],
      default: 'pending',
    },
    gstDetails: {
      taxableValue: Number,
      cgst: Number,
      sgst: Number,
      igst: Number,
      totalTax: Number,
      hsnSummary: [
        {
          hsnCode: String,
          taxableValue: Number,
          gstRate: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
        },
      ],
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

invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ createdAt: -1 });

export default mongoose.model('Invoice', invoiceSchema);
