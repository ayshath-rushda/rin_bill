import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    url: {
      type: String,
      default: '',
    },
    position: {
      type: String,
      enum: ['top', 'middle', 'bottom'],
      required: [true, 'Banner position is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bannerSchema.index({ position: 1, isActive: 1 });

export default mongoose.model('Banner', bannerSchema);
