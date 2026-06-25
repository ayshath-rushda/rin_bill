import Joi from 'joi';

export const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.isOperational = true;
    err.details = details;
    return next(err);
  }
  req.body = value;
  next();
};

export const createInvoiceItemSchema = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).optional(),
});

export const createInvoiceSchema = Joi.object({
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow('', null),
  customerSnapshot: Joi.object({
    name: Joi.string().optional().allow(''),
    phone: Joi.string().optional().allow(''),
    email: Joi.string().email().optional().allow(''),
    gstin: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
  }).optional(),
  items: Joi.array().items(createInvoiceItemSchema).min(1).required(),
  discount: Joi.number().min(0).optional().default(0),
  paymentMethod: Joi.string().valid('cash', 'upi', 'bank_transfer').required(),
  amountPaid: Joi.number().min(0).optional(),
  type: Joi.string().valid('retail', 'wholesale').optional().default('retail'),
  notes: Joi.string().max(500).optional().allow(''),
});

export const paymentSchema = Joi.object({
  invoiceId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  amount: Joi.number().min(1).required(),
  method: Joi.string().valid('cash', 'upi', 'bank_transfer').required(),
  transactionRef: Joi.string().optional().allow(''),
  notes: Joi.string().max(200).optional().allow(''),
});

export const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('retail', 'wholesale').optional(),
  paymentStatus: Joi.string().valid('pending', 'completed', 'partial', 'cancelled').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  search: Joi.string().optional(),
});
