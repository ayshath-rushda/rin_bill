import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    vehicleCompatibility: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    shortDescription: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockLimit: {
      type: Number,
      default: 5,
    },
    weight: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'draft',
    },
    hsnCode: {
      type: String,
    },
    gstRate: {
      type: Number,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'product';
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Product').exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  next();
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ sellingPrice: 1 });

export default mongoose.model('Product', productSchema);
