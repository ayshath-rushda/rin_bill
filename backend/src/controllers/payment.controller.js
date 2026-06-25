import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import AppError from '../utils/AppError.js';
import paginate from '../utils/paginate.js';

export const recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, method, transactionRef, notes } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }
    if (invoice.paymentStatus === 'cancelled') {
      throw new AppError('Invoice is cancelled', 400, 'INVOICE_CANCELLED');
    }

    const newTotalPaid = (invoice.amountPaid || 0) + amount;
    if (newTotalPaid > invoice.total) {
      throw new AppError('Payment exceeds invoice total', 400, 'OVERPAYMENT');
    }

    const payment = await Payment.create({
      invoice: invoiceId,
      amount,
      method,
      transactionRef,
      status: 'completed',
      notes,
      createdBy: req.user._id,
    });

    invoice.amountPaid = newTotalPaid;
    invoice.balance = invoice.total - newTotalPaid;
    invoice.paymentStatus = newTotalPaid >= invoice.total ? 'completed' : 'partial';
    await invoice.save();

    res.status(201).json({ success: true, data: payment.toObject() });
  } catch (error) {
    next(error);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const { page, limit, invoiceId, method, dateFrom, dateTo } = req.query;

    const filter = {};
    if (invoiceId) filter.invoice = invoiceId;
    if (method) filter.method = method;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const result = await paginate(Payment, filter, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: { createdAt: -1 },
      populate: { path: 'invoice', select: 'invoiceNumber total' },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
