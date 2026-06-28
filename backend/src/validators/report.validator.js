import Joi from 'joi';

export const salesQuerySchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').default('daily'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const inventoryMovementQuerySchema = Joi.object({
  product: Joi.string(),
  type: Joi.string().valid('stock_in', 'stock_out', 'adjustment'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const ordersQuerySchema = Joi.object({
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

export const topCustomersQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const customerPurchasesQuerySchema = Joi.object({
  customerId: Joi.string().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const exportSalesQuerySchema = Joi.object({
  format: Joi.string().valid('excel', 'pdf').required(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

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

export const validateQuery = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.isOperational = true;
    err.details = details;
    return next(err);
  }
  req.query = value;
  next();
};
