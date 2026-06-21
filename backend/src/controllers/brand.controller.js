import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';

export const getAll = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!brand) {
      throw new AppError('Brand not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const productsCount = await Product.countDocuments({ brand: req.params.id });
    if (productsCount > 0) {
      throw new AppError(
        `Cannot delete brand: ${productsCount} product(s) are attached to it`,
        409,
        'BRAND_HAS_PRODUCTS'
      );
    }
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      throw new AppError('Brand not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
