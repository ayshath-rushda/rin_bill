import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';

export const getAllPublic = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      throw new AppError(
        `Cannot delete category: ${productsCount} product(s) are attached to it`,
        409,
        'CATEGORY_HAS_PRODUCTS'
      );
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
