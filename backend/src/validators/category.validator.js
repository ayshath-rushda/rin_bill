import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Category name must be at least 2 characters',
    'any.required': 'Category name is required',
  }),
  image: Joi.string().allow(''),
  description: Joi.string().allow('').max(500),
  isActive: Joi.boolean(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  image: Joi.string().allow(''),
  description: Joi.string().allow('').max(500),
  isActive: Joi.boolean(),
});
