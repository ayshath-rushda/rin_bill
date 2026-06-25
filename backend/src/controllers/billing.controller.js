import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import StockTransaction from '../models/StockTransaction.js';
import AppError from '../utils/AppError.js';
import paginate from '../utils/paginate.js';
import { generateInvoiceNumber } from '../services/billing.service.js';
import { computeGST, buildHsnSummary } from '../services/gst.service.js';

export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.find({
      status: 'active',
      $or: [
        { code: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name code sku sellingPrice stock images hsnCode gstRate')
      .limit(20)
      .lean();

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { customerId, customerSnapshot, items, discount, paymentMethod, amountPaid, type, notes } = req.body;

    const invoiceItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product || product.status !== 'active') {
        throw new AppError(`Product not found or inactive: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stock}`, 409, 'INSUFFICIENT_STOCK');
      }

      const price = item.price || product.sellingPrice;
      const total = price * item.quantity;
      subtotal += total;

      const gstAmount = product.gstRate
        ? Math.round((total * product.gstRate) / 100)
        : 0;

      invoiceItems.push({
        product: product._id,
        productSnapshot: {
          name: product.name,
          code: product.code,
          image: product.images?.[0] || '',
          hsnCode: product.hsnCode || '',
        },
        quantity: item.quantity,
        price,
        total,
        gstRate: product.gstRate || 0,
        gstAmount,
      });
    }

    const discountAmount = discount || 0;
    const taxableValue = subtotal - discountAmount;
    const taxTotal = invoiceItems.reduce((sum, i) => sum + i.gstAmount, 0);
    const total = taxableValue + taxTotal;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customerId || undefined,
      customerSnapshot: customerSnapshot || {},
      items: invoiceItems,
      subtotal,
      discount: discountAmount,
      taxTotal,
      total,
      amountPaid: amountPaid || 0,
      balance: total - (amountPaid || 0),
      type: type || 'retail',
      paymentMethod,
      paymentStatus: !amountPaid || amountPaid >= total ? 'completed' : amountPaid > 0 ? 'partial' : 'pending',
      gstDetails: {
        taxableValue,
        cgst: Math.round(taxTotal / 2),
        sgst: taxTotal - Math.round(taxTotal / 2),
        igst: 0,
        totalTax: taxTotal,
        hsnSummary: buildHsnSummary(invoiceItems),
      },
      notes,
      createdBy: req.user._id,
    });

    for (const item of invoiceItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      await StockTransaction.create({
        product: item.product,
        type: 'stock_out',
        quantity: item.quantity,
        previousStock: 0,
        newStock: 0,
        reason: 'pos_sale',
        reference: invoiceNumber,
        user: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: invoice.toObject() });
  } catch (error) {
    next(error);
  }
};

export const listInvoices = async (req, res, next) => {
  try {
    const { page, limit, type, paymentStatus, dateFrom, dateTo, search } = req.query;

    const filter = {};
    if (type) filter.type = type;
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
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const result = await paginate(Invoice, filter, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: { createdAt: -1 },
      select: 'invoiceNumber customerSnapshot subtotal total amountPaid balance type paymentStatus paymentMethod createdAt',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name')
      .lean();

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const printInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name')
      .lean();

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        ...invoice,
        _printFriendly: true,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
