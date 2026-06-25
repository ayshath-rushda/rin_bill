import mongoose from 'mongoose';

const featuredProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    section: {
      type: String,
      enum: {
        values: ['featured', 'best_seller', 'new_arrival'],
        message: 'Section must be featured, best_seller, or new_arrival',
      },
      required: [true, 'Section is required'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

featuredProductSchema.index({ product: 1, section: 1 }, { unique: true });
featuredProductSchema.index({ section: 1, displayOrder: 1 });

export default mongoose.model('FeaturedProduct', featuredProductSchema);
