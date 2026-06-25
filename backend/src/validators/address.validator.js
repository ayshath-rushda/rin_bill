import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid ID format',
});

export const createAddressSchema = Joi.object({
  label: Joi.string().valid('Home', 'Office', 'Other').default('Home'),
  line1: Joi.string().trim().required().messages({
    'any.required': 'Address line 1 is required',
  }),
  line2: Joi.string().trim().allow('').default(''),
  city: Joi.string().trim().required().messages({
    'any.required': 'City is required',
  }),
  state: Joi.string().trim().required().messages({
    'any.required': 'State is required',
  }),
  pincode: Joi.string().regex(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Pincode must be 6 digits',
    'any.required': 'Pincode is required',
  }),
  phone: Joi.string().trim().required().messages({
    'any.required': 'Phone is required',
  }),
  isDefault: Joi.boolean().default(false),
});

export const updateAddressSchema = Joi.object({
  label: Joi.string().valid('Home', 'Office', 'Other'),
  line1: Joi.string().trim(),
  line2: Joi.string().trim().allow(''),
  city: Joi.string().trim(),
  state: Joi.string().trim(),
  pincode: Joi.string().regex(/^\d{6}$/).messages({
    'string.pattern.base': 'Pincode must be 6 digits',
  }),
  phone: Joi.string().trim(),
  isDefault: Joi.boolean(),
});

export const addressIdSchema = Joi.object({
  id: objectId.required().messages({
    'any.required': 'Address ID is required',
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
