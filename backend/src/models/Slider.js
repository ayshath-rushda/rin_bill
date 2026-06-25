import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Slider title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    buttonText: {
      type: String,
      default: '',
    },
    buttonUrl: {
      type: String,
      default: '',
    },
    bannerImage: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

sliderSchema.index({ displayOrder: 1 });
sliderSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

sliderSchema.virtual('isScheduled').get(function () {
  const now = new Date();
  if (this.startDate && this.endDate) {
    return now >= this.startDate && now <= this.endDate;
  }
  if (this.startDate) return now >= this.startDate;
  if (this.endDate) return now <= this.endDate;
  return true;
});

sliderSchema.set('toJSON', { virtuals: true });
sliderSchema.set('toObject', { virtuals: true });

export default mongoose.model('Slider', sliderSchema);
