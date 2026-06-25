import Slider from '../models/Slider.js';
import Banner from '../models/Banner.js';
import FeaturedProduct from '../models/FeaturedProduct.js';
import AppError from '../utils/AppError.js';
import { cloudinary, useCloudinary } from '../config/upload.js';

const fullUrl = (req, path) => {
  if (!path || !path.startsWith('/')) return path;
  return `${req.protocol}://${req.get('host')}${path}`;
};

const mapSlider = (req, s) => ({ ...s, bannerImage: fullUrl(req, s.bannerImage) });
const mapBanner = (req, b) => ({ ...b, image: fullUrl(req, b.image) });

/* ---------- Slider ---------- */

export const getSliders = async (req, res, next) => {
  try {
    const now = new Date();
    const sliders = await Slider.find({
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    })
      .sort({ displayOrder: 1 })
      .lean();

    res.json({ success: true, data: sliders.map((s) => mapSlider(req, s)) });
  } catch (error) {
    next(error);
  }
};

export const getAllSliders = async (req, res, next) => {
  try {
    const sliders = await Slider.find().sort({ displayOrder: 1 }).lean();
    res.json({ success: true, data: sliders.map((s) => mapSlider(req, s)) });
  } catch (error) {
    next(error);
  }
};

export const createSlider = async (req, res, next) => {
  try {
    const slider = await Slider.create(req.body);
    res.status(201).json({ success: true, data: mapSlider(req, slider.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const updateSlider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slider = await Slider.findById(id);
    if (!slider) {
      throw new AppError('Slider not found', 404, 'NOT_FOUND');
    }

    const updateData = { ...req.body };

    if (updateData.bannerImage && updateData.bannerImage !== slider.bannerImage && slider.bannerImage) {
      if (useCloudinary) {
        const publicId = slider.bannerImage.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`rinbill/sliders/${publicId}`).catch(() => {});
        }
      }
    }

    Object.assign(slider, updateData);
    await slider.save();
    res.json({ success: true, data: mapSlider(req, slider.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const deleteSlider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slider = await Slider.findById(id);
    if (!slider) {
      throw new AppError('Slider not found', 404, 'NOT_FOUND');
    }
    if (slider.bannerImage && useCloudinary) {
      const publicId = slider.bannerImage.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`rinbill/sliders/${publicId}`).catch(() => {});
      }
    }
    await slider.deleteOne();
    res.json({ success: true, data: { message: 'Slider deleted' } });
  } catch (error) {
    next(error);
  }
};

export const reorderSliders = async (req, res, next) => {
  try {
    const { items } = req.body;
    const ids = items.map((i) => i.id);
    const existing = await Slider.find({ _id: { $in: ids } });
    if (existing.length !== items.length) {
      throw new AppError('One or more sliders not found', 404, 'NOT_FOUND');
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.displayOrder },
      },
    }));
    await Slider.bulkWrite(bulkOps);

    const sliders = await Slider.find().sort({ displayOrder: 1 }).lean();
    res.json({ success: true, data: sliders.map((s) => mapSlider(req, s)) });
  } catch (error) {
    next(error);
  }
};

/* ---------- Banner ---------- */

export const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: banners.map((b) => mapBanner(req, b)) });
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: banners.map((b) => mapBanner(req, b)) });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, data: mapBanner(req, banner.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      throw new AppError('Banner not found', 404, 'NOT_FOUND');
    }

    const updateData = { ...req.body };

    if (updateData.image && updateData.image !== banner.image && banner.image) {
      if (useCloudinary) {
        const publicId = banner.image.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`rinbill/banners/${publicId}`).catch(() => {});
        }
      }
    }

    Object.assign(banner, updateData);
    await banner.save();
    res.json({ success: true, data: mapBanner(req, banner.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      throw new AppError('Banner not found', 404, 'NOT_FOUND');
    }
    if (banner.image && useCloudinary) {
      const publicId = banner.image.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`rinbill/banners/${publicId}`).catch(() => {});
      }
    }
    await banner.deleteOne();
    res.json({ success: true, data: { message: 'Banner deleted' } });
  } catch (error) {
    next(error);
  }
};

/* ---------- Featured Products ---------- */

export const getFeaturedProducts = async (_req, res, next) => {
  try {
    const featured = await FeaturedProduct.find()
      .populate('product', 'name slug images sellingPrice status')
      .sort({ section: 1, displayOrder: 1 })
      .lean();

    const grouped = {
      featured: [],
      best_seller: [],
      new_arrival: [],
    };

    featured.forEach((fp) => {
      if (fp.product && fp.product.status === 'active') {
        grouped[fp.section]?.push(fp);
      }
    });

    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
};

export const getAllFeaturedProducts = async (req, res, next) => {
  try {
    const featured = await FeaturedProduct.find()
      .populate('product', 'name code images sellingPrice status')
      .sort({ section: 1, displayOrder: 1 })
      .lean();
    res.json({ success: true, data: featured });
  } catch (error) {
    next(error);
  }
};

export const assignFeatured = async (req, res, next) => {
  try {
    const { productId, section, displayOrder } = req.body;

    const existing = await FeaturedProduct.findOne({ product: productId, section });
    if (existing) {
      throw new AppError('Product is already assigned to this section', 409, 'DUPLICATE_ASSIGNMENT');
    }

    const featured = await FeaturedProduct.create({ product: productId, section, displayOrder });
    const populated = await FeaturedProduct.findById(featured._id)
      .populate('product', 'name code images sellingPrice')
      .lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const removeFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const featured = await FeaturedProduct.findById(id);
    if (!featured) {
      throw new AppError('Featured product assignment not found', 404, 'NOT_FOUND');
    }
    await featured.deleteOne();
    res.json({ success: true, data: { message: 'Product removed from section' } });
  } catch (error) {
    next(error);
  }
};

/* ---------- Image Upload ---------- */

export const uploadImage = async (req, res, next) => {
  try {
    const file = req.files?.[0];
    if (!file) {
      throw new AppError('No file provided', 400, 'NO_FILE');
    }
    const url = useCloudinary
      ? file.path
      : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
};
