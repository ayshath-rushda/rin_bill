import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Courier from '../models/Courier.js';
import Address from '../models/Address.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import AppError from '../utils/AppError.js';
import paginate from '../utils/paginate.js';
import generateOrderNumber from '../utils/generateOrderNumber.js';
import { isValidTransition, handleStatusSideEffects } from '../services/order.service.js';

export const create = async (req, res, next) => {
  try {
    const { addressId, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name sellingPrice stock images status');
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    if (activeItems.length === 0) {
      throw new AppError('No active items in cart to order', 400, 'NO_ACTIVE_ITEMS');
    }

    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    for (const item of activeItems) {
      const product = item.product;
      if (!product || product.status !== 'active') {
        throw new AppError(`Product "${product?.name || 'Unknown'}" is not available`, 400, 'PRODUCT_UNAVAILABLE');
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stock}`, 409, 'INSUFFICIENT_STOCK');
      }
    }

    let subtotal = 0;
    for (const item of activeItems) {
      subtotal += item.product.sellingPrice * item.quantity;
    }
    const total = subtotal;

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      addressSnapshot: {
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        phone: address.phone,
      },
      subtotal,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed',
    });

    const orderItems = [];
    for (const item of activeItems) {
      const orderItem = await OrderItem.create({
        order: order._id,
        product: item.product._id,
        productSnapshot: {
          name: item.product.name,
          price: item.product.sellingPrice,
          image: item.product.images?.[0] || '',
        },
        quantity: item.quantity,
        price: item.product.sellingPrice,
      });
      orderItems.push(orderItem._id);

      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
      await StockTransaction.create({
        product: item.product._id,
        type: 'stock_out',
        quantity: item.quantity,
        previousStock: item.product.stock,
        newStock: item.product.stock - item.quantity,
        reason: 'order',
        reference: orderNumber,
        user: req.user._id,
      });
    }

    order.items = orderItems;
    await order.save();

    cart.items = [];
    await cart.save();

    const populated = await Order.findById(order._id)
      .populate('items')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await paginate(
      Order,
      { user: req.user._id },
      {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        sort: { createdAt: -1 },
        populate: { path: 'items' },
      }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role?.name !== 'super_admin' && req.user.role?.name !== 'ecommerce_staff') {
      filter.user = req.user._id;
    }
    const order = await Order.findOne(filter)
      .populate('items')
      .populate('user', 'name email phone')
      .lean();
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }
    const courier = await Courier.findOne({ order: order._id }).lean();
    order.courier = courier || null;
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const adminList = async (req, res, next) => {
  try {
    if (req.user.role?.name === 'customer') {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const { page, limit, status, paymentStatus, dateFrom, dateTo, search } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const result = await paginate(
      Order,
      filter,
      {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        sort: { createdAt: -1 },
        populate: [
          { path: 'items' },
          { path: 'user', select: 'name email' },
        ],
      }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const order = await Order.findById(req.params.id).populate('items');
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    if (!isValidTransition(order.orderStatus, status)) {
      throw new AppError(
        `Cannot transition from '${order.orderStatus}' to '${status}'`,
        409,
        'INVALID_TRANSITION'
      );
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    await order.save();

    await handleStatusSideEffects(order, previousStatus, status);

    const updated = await Order.findById(order._id)
      .populate('items')
      .populate('user', 'name email phone')
      .lean();

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const assignCourier = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const courier = await Courier.findOneAndUpdate(
      { order: req.params.id },
      { $set: req.body },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: courier });
  } catch (error) {
    next(error);
  }
};

export const tracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).select('orderNumber orderStatus').lean();
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const courier = await Courier.findOne({ order: req.params.id })
      .select('courierName trackingNumber dispatchDate estimatedDelivery actualDelivery')
      .lean();

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        courier: courier || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
