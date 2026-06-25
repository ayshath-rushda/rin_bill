import Joi from 'joi';

export const createOrderSchema = Joi.object({
  addressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'any.required': 'Address ID is required',
    'string.pattern.base': 'Invalid address ID format',
  }),
  paymentMethod: Joi.string().valid('cash', 'upi', 'bank_transfer').required().messages({
    'any.required': 'Payment method is required',
    'any.only': 'Payment method must be cash, upi, or bank_transfer',
  }),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('new', 'confirmed', 'packing', 'dispatched', 'delivered', 'cancelled', 'returned')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Invalid order status',
    }),
  reason: Joi.string().max(200).optional().allow(''),
});

export const assignCourierSchema = Joi.object({
  courierName: Joi.string().required().trim().messages({
    'any.required': 'Courier name is required',
  }),
  trackingNumber: Joi.string().required().trim().messages({
    'any.required': 'Tracking number is required',
  }),
  dispatchDate: Joi.date().optional(),
  estimatedDelivery: Joi.date().optional(),
});

export const orderIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'any.required': 'Order ID is required',
    'string.pattern.base': 'Invalid order ID format',
  }),
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

export const validateParams = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.isOperational = true;
    err.details = details;
    return next(err);
  }
  req.params = value;
  next();
};
