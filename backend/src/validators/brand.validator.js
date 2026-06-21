import Joi from 'joi';

export const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Brand name must be at least 2 characters',
    'any.required': 'Brand name is required',
  }),
  logo: Joi.string().allow(''),
  description: Joi.string().allow('').max(500),
});

export const updateBrandSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  logo: Joi.string().allow(''),
  description: Joi.string().allow('').max(500),
});
