import Order from '../models/Order.js';

const generateOrderNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = `ORD-${y}${m}${d}-`;

  const lastOrder = await Order.findOne({ orderNumber: { $regex: `^${prefix}` } })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();

  let seq = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split('-');
    seq = parseInt(parts[3], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(5, '0')}`;
};

export default generateOrderNumber;
