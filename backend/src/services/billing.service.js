import Invoice from '../models/Invoice.js';

export const generateInvoiceNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = `INV-${y}${m}${d}-`;

  const last = await Invoice.findOne({ invoiceNumber: { $regex: `^${prefix}` } })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  let seq = 1;
  if (last) {
    const parts = last.invoiceNumber.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(5, '0')}`;
};
