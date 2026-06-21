import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import AppError from '../utils/AppError.js';
import paginate from '../utils/paginate.js';
import { cloudinary } from '../config/cloudinary.js';

const generateProductCode = async () => {
  const lastProduct = await Product.findOne().sort({ createdAt: -1 }).select('code').lean();
  let nextNum = 1;
  if (lastProduct?.code) {
    const match = lastProduct.code.match(/PRD-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  return `PRD-${String(nextNum).padStart(4, '0')}`;
};

const getGstEnabled = async () => {
  const setting = await Setting.findOne({ key: 'gstEnabled' }).lean();
  return setting?.value === true;
};

const stripGstFields = (body) => {
  delete body.hsnCode;
  delete body.gstRate;
  return body;
};

const validateGstFields = (body) => {
  const errors = [];
  if (!body.hsnCode) {
    errors.push('HSN Code is required when GST is enabled');
  }
  if (body.gstRate === undefined || body.gstRate === null) {
    errors.push('GST Rate is required when GST is enabled');
  }
  return errors;
};

export const list = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
      status,
    } = req.query;

    const filter = {};

    if (!req.user || req.user.role?.name === 'customer') {
      filter.status = 'active';
    } else if (status) {
      filter.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { code: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = parseFloat(maxPrice);
    }

    let sort = { createdAt: -1 };
    switch (sortBy) {
      case 'price_asc':
        sort = { sellingPrice: 1 };
        break;
      case 'price_desc':
        sort = { sellingPrice: -1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
    }

    const result = await paginate(Product, filter, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sort,
      populate: 'category brand',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getFeatured = async (req, res, next) => {
  try {
    const featured = await Product.find({
      status: 'active',
      $or: [
        { isFeatured: true },
        { isBestSeller: true },
        { isNewArrival: true },
      ],
    })
      .populate('category brand')
      .limit(20)
      .lean();

    const grouped = {
      featured: featured.filter((p) => p.isFeatured),
      bestSeller: featured.filter((p) => p.isBestSeller),
      newArrival: featured.filter((p) => p.isNewArrival),
    };

    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
};

export const getBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category brand')
      .lean();

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const gstEnabled = await getGstEnabled();
    if (!gstEnabled) {
      delete product.hsnCode;
      delete product.gstRate;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category brand')
      .lean();

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const gstEnabled = await getGstEnabled();
    if (!gstEnabled) {
      delete product.hsnCode;
      delete product.gstRate;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const gstEnabled = await getGstEnabled();
    if (!gstEnabled) {
      stripGstFields(req.body);
    } else {
      const gstErrors = validateGstFields(req.body);
      if (gstErrors.length > 0) {
        throw new AppError(gstErrors.join('; '), 400, 'GST_VALIDATION_ERROR');
      }
    }

    req.body.code = await generateProductCode();
    const product = await Product.create(req.body);
    const populated = await Product.findById(product._id).populate('category brand');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const gstEnabled = await getGstEnabled();
    if (!gstEnabled) {
      stripGstFields(req.body);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category brand');

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    if (!gstEnabled) {
      const result = product.toObject();
      delete result.hsnCode;
      delete result.gstRate;
      return res.json({ success: true, data: result });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const uploadImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400, 'NO_FILES');
    }

    const urls = req.files.map((file) => file.path);
    const target = req.body.type === 'gallery' ? 'galleryImages' : 'images';

    if (product[target].length + urls.length > 10) {
      throw new AppError('Maximum 10 images allowed', 400, 'MAX_IMAGES');
    }

    product[target].push(...urls);
    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const { imageId } = req.params;
    const allImages = [...product.images, ...product.galleryImages];

    const imageUrl = allImages.find((url) => url.includes(imageId));
    if (!imageUrl) {
      throw new AppError('Image not found on this product', 404, 'IMAGE_NOT_FOUND');
    }

    const publicId = imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`rinbill/${publicId}`);

    product.images = product.images.filter((url) => !url.includes(imageId));
    product.galleryImages = product.galleryImages.filter((url) => !url.includes(imageId));
    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
