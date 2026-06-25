import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';

export const VALID_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['dispatched'],
  dispatched: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const isValidTransition = (from, to) => {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};

export const handleStatusSideEffects = async (order, previousStatus, newStatus) => {
  const sideEffects = [];

  if ((newStatus === 'cancelled' || newStatus === 'returned') && previousStatus !== newStatus) {
    const populated = await order.populate('items');
    for (const item of populated.items) {
      const product = await Product.findById(item.product);
      if (product) {
        sideEffects.push(
          Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }).exec()
        );
        sideEffects.push(
          StockTransaction.create({
            product: item.product,
            type: 'stock_in',
            quantity: item.quantity,
            previousStock: product.stock,
            newStock: product.stock + item.quantity,
            reason: newStatus === 'cancelled' ? 'order_cancelled' : 'order_returned',
            reference: order.orderNumber,
            user: order.user,
          })
        );
      }
    }
  }

  if (newStatus === 'delivered' && order.paymentMethod === 'cash') {
    order.paymentStatus = 'completed';
    sideEffects.push(order.save());
  }

  await Promise.all(sideEffects);
};
