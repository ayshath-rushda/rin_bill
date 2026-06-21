import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import AppError from '../utils/AppError.js';
import paginate from '../utils/paginate.js';

export const list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await paginate(Product, {}, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: { name: 1 },
      select: 'name code sku stock lowStockLimit status category',
      populate: { path: 'category', select: 'name' },
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId)
      .select('name code sku stock lowStockLimit status category')
      .populate('category', 'name')
      .lean();
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const stockIn = async (req, res, next) => {
  try {
    const { productId, quantity, reason, reference } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    const previousStock = product.stock;
    product.stock += quantity;
    await product.save();
    await StockTransaction.create({
      product: productId,
      type: 'stock_in',
      quantity,
      previousStock,
      newStock: product.stock,
      reason,
      reference,
      user: req.user._id,
    });
    res.json({
      success: true,
      data: { product: { _id: product._id, stock: product.stock }, previousStock, newStock: product.stock },
    });
  } catch (error) {
    next(error);
  }
};

export const stockOut = async (req, res, next) => {
  try {
    const { productId, quantity, reason, reference } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    if (product.stock < quantity) {
      throw new AppError(
        `Insufficient stock. Available: ${product.stock}, requested: ${quantity}`,
        409,
        'INSUFFICIENT_STOCK'
      );
    }
    const previousStock = product.stock;
    product.stock -= quantity;
    await product.save();
    await StockTransaction.create({
      product: productId,
      type: 'stock_out',
      quantity,
      previousStock,
      newStock: product.stock,
      reason,
      reference,
      user: req.user._id,
    });
    res.json({
      success: true,
      data: { product: { _id: product._id, stock: product.stock }, previousStock, newStock: product.stock },
    });
  } catch (error) {
    next(error);
  }
};

export const adjust = async (req, res, next) => {
  try {
    if (req.user.role?.name !== 'super_admin') {
      throw new AppError('Only Super Admin can adjust stock', 403, 'FORBIDDEN');
    }
    const { productId, quantity, reason } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    const previousStock = product.stock;
    product.stock = quantity;
    await product.save();
    await StockTransaction.create({
      product: productId,
      type: 'adjustment',
      quantity: Math.abs(quantity - previousStock) || 1,
      previousStock,
      newStock: quantity,
      reason,
      user: req.user._id,
    });
    res.json({
      success: true,
      data: { product: { _id: product._id, stock: product.stock }, previousStock, newStock: quantity },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { product, type, dateFrom, dateTo, page, limit } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (type) filter.type = type;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    const result = await paginate(StockTransaction, filter, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: { createdAt: -1 },
      populate: [
        { path: 'product', select: 'name code' },
        { path: 'user', select: 'name' },
      ],
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockLimit'] },
      status: { $ne: 'inactive' },
    })
      .select('name code sku stock lowStockLimit')
      .sort({ stock: 1 })
      .lean();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
