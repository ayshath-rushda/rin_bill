import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid ID format',
});

export const addItemSchema = Joi.object({
  productId: objectId.required().messages({
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).default(1),
});

export const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Quantity must be 0 or more',
    'any.required': 'Quantity is required',
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
