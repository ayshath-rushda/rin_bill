import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid ID format',
});

export const stockInSchema = Joi.object({
  productId: objectId.required().messages({
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  reason: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Reason is required',
    'string.max': 'Reason must be at most 200 characters',
    'any.required': 'Reason is required',
  }),
  reference: Joi.string().trim().max(100).allow(''),
});

const stockOutReasons = ['damaged', 'expired', 'stolen', 'returned', 'other'];

export const stockOutSchema = Joi.object({
  productId: objectId.required().messages({
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  reason: Joi.string()
    .valid(...stockOutReasons)
    .required()
    .messages({
      'any.only': `Reason must be one of: ${stockOutReasons.join(', ')}`,
      'any.required': 'Reason is required',
    }),
  reference: Joi.string().trim().max(100).allow(''),
});

export const adjustSchema = Joi.object({
  productId: objectId.required().messages({
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Quantity cannot be negative',
    'any.required': 'Quantity is required',
  }),
  reason: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Reason is required',
    'string.max': 'Reason must be at most 200 characters',
    'any.required': 'Reason is required',
  }),
});

export const historyQuerySchema = Joi.object({
  product: objectId,
  type: Joi.string().valid('stock_in', 'stock_out', 'adjustment'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
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
