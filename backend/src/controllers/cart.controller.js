import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import AppError from '../utils/AppError.js';

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name slug sellingPrice stock images status');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId).select('sellingPrice stock status name');
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    if (product.status !== 'active') {
      throw new AppError('Product is not available', 400, 'PRODUCT_INACTIVE');
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existing = cart.items.find((item) => item.product.toString() === productId);
    const newQty = existing ? existing.quantity + (quantity || 1) : (quantity || 1);
    if (newQty > product.stock) {
      throw new AppError(`Only ${product.stock} items in stock`, 400, 'INSUFFICIENT_STOCK');
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: newQty || 1 });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug sellingPrice stock images status');

    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      throw new AppError('Item not found in cart', 404, 'ITEM_NOT_FOUND');
    }

    if (quantity === 0) {
      cart.items.pull({ _id: item._id });
    } else {
      const product = await Product.findById(productId).select('stock');
      if (quantity > product.stock) {
        throw new AppError(`Only ${product.stock} items in stock`, 400, 'INSUFFICIENT_STOCK');
      }
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name slug sellingPrice stock images status');

    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    cart.items.pull({ product: productId });
    await cart.save();
    await cart.populate('items.product', 'name slug sellingPrice stock images status');

    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const toggleSaveForLater = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      throw new AppError('Cart not found', 404, 'NOT_FOUND');
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      throw new AppError('Item not found in cart', 404, 'ITEM_NOT_FOUND');
    }

    item.savedForLater = !item.savedForLater;
    await cart.save();
    await cart.populate('items.product', 'name slug sellingPrice stock images status');

    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};
