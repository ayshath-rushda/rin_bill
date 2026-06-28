import Order from '../models/Order.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import paginate from '../utils/paginate.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const buildDateMatch = (dateFrom, dateTo) => {
  const match = {};
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }
  return match;
};

export const getSales = async (req, res, next) => {
  try {
    const { period, dateFrom, dateTo } = req.query;
    const match = buildDateMatch(dateFrom, dateTo);

    let dateTrunc;
    switch (period) {
      case 'yearly': dateTrunc = { $dateToString: { format: '%Y', date: '$createdAt' } }; break;
      case 'monthly': dateTrunc = { $dateToString: { format: '%Y-%m', date: '$createdAt' } }; break;
      case 'weekly': dateTrunc = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }; break;
      default: dateTrunc = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const data = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: dateTrunc,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          totalOrders: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
        },
      },
    ]);

    const totals = data.reduce(
      (acc, row) => ({
        totalOrders: acc.totalOrders + row.totalOrders,
        totalRevenue: acc.totalRevenue + row.totalRevenue,
      }),
      { totalOrders: 0, totalRevenue: 0 }
    );

    res.json({
      success: true,
      data: {
        records: data,
        summary: {
          totalOrders: totals.totalOrders,
          totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
          averageOrderValue: data.length ? Math.round((totals.totalRevenue / totals.totalOrders) * 100) / 100 : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryStock = async (req, res, next) => {
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

export const getInventoryMovement = async (req, res, next) => {
  try {
    const { product, type, dateFrom, dateTo, page: p, limit: l } = req.query;
    const match = {};
    if (product) match.product = product;
    if (type) match.type = type;
    Object.assign(match, buildDateMatch(dateFrom, dateTo));

    const page = parseInt(p, 10) || 1;
    const limit = parseInt(l, 10) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      StockTransaction.find(match)
        .populate('product', 'name code')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockTransaction.countDocuments(match),
    ]);

    res.json({
      success: true,
      data: {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const match = buildDateMatch(dateFrom, dateTo);

    const data = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
        },
      },
    ]);

    const totals = data.reduce(
      (acc, row) => ({
        totalOrders: acc.totalOrders + row.count,
        totalRevenue: acc.totalRevenue + row.totalRevenue,
      }),
      { totalOrders: 0, totalRevenue: 0 }
    );

    res.json({
      success: true,
      data: {
        records: data,
        summary: {
          totalOrders: totals.totalOrders,
          totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopCustomers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const data = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpend: { $sum: '$total' },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalOrders: 1,
          totalSpend: { $round: ['$totalSpend', 2] },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getCustomerPurchases = async (req, res, next) => {
  try {
    const { customerId, page: p, limit: l } = req.query;
    const page = parseInt(p, 10) || 1;
    const limit = parseInt(l, 10) || 20;

    const user = await User.findById(customerId).lean();
    if (!user) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    const result = await paginate(Order, { user: customerId }, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'items', populate: { path: 'product', select: 'name' } },
    });

    res.json({
      success: true,
      data: {
        customer: { _id: user._id, name: user.name, email: user.email },
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportSales = async (req, res, next) => {
  try {
    const { format, dateFrom, dateTo } = req.query;
    const match = buildDateMatch(dateFrom, dateTo);

    const orders = await Order.find(match)
      .populate('user', 'name email')
      .populate({ path: 'items', populate: { path: 'product', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean();

    const rows = orders.map((o) => ({
      date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '',
      orderNumber: o.orderNumber || '',
      customer: o.user?.name || 'N/A',
      items: o.items?.map((i) => i.productSnapshot?.name || 'Unknown').join(', ') || '',
      subtotal: o.subtotal || 0,
      tax: 0,
      total: o.total || 0,
    }));

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sales Report');
      sheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Order #', key: 'orderNumber', width: 20 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Items', key: 'items', width: 40 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'Tax', key: 'tax', width: 10 },
        { header: 'Total', key: 'total', width: 12 },
      ];
      sheet.getRow(1).font = { bold: true };
      rows.forEach((row) => sheet.addRow(row));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFrom || 'all'}-${dateTo || 'all'}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFrom || 'all'}-${dateTo || 'all'}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text('Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'End'}`);
      doc.moveDown();

      const tableTop = doc.y;
      const colWidths = [60, 90, 90, 50, 50, 50];
      const headers = ['Date', 'Order #', 'Customer', 'Subtotal', 'Tax', 'Total'];

      doc.fontSize(8).font('Helvetica-Bold');
      let x = 30;
      headers.forEach((h, i) => { doc.text(h, x, tableTop, { width: colWidths[i], align: 'left' }); x += colWidths[i]; });
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(7);
      let y = doc.y;
      for (const row of rows) {
        if (y > 700) { doc.addPage(); y = 30; }
        x = 30;
        const values = [row.date, row.orderNumber, row.customer, row.subtotal.toFixed(2), row.tax.toFixed(2), row.total.toFixed(2)];
        values.forEach((v, i) => { doc.text(String(v), x, y, { width: colWidths[i], align: 'left' }); x += colWidths[i]; });
        y += 14;
      }

      doc.end();
    }
  } catch (error) {
    next(error);
  }
};

export const exportInventory = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .populate('category', 'name')
      .select('name code sku stock lowStockLimit status category')
      .sort({ name: 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory');
    sheet.columns = [
      { header: 'Code', key: 'code', width: 16 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Low Stock Limit', key: 'lowStockLimit', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };
    products.forEach((p) =>
      sheet.addRow({
        code: p.code,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || '',
        stock: p.stock,
        lowStockLimit: p.lowStockLimit,
        status: p.status,
      })
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-report.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
