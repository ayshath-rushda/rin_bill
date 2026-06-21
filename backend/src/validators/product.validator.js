import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'string.min': 'Product name must be at least 2 characters',
    'any.required': 'Product name is required',
  }),
  sku: Joi.string().trim().max(50).messages({
    'string.max': 'SKU must be at most 50 characters',
  }),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid category ID',
  }),
  brand: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid brand ID',
  }),
  vehicleCompatibility: Joi.array().items(Joi.string().trim()),
  description: Joi.string().allow(''),
  shortDescription: Joi.string().allow('').max(300),
  sellingPrice: Joi.number().min(0).required().messages({
    'number.min': 'Selling price cannot be negative',
    'any.required': 'Selling price is required',
  }),
  costPrice: Joi.number().min(0).allow(null),
  stock: Joi.number().integer().min(0).default(0),
  lowStockLimit: Joi.number().integer().min(0).default(5),
  weight: Joi.number().min(0).allow(null),
  status: Joi.string().valid('active', 'inactive', 'draft').default('draft'),
  hsnCode: Joi.string().allow(''),
  gstRate: Joi.number().valid(0, 5, 12, 18, 28).allow(null),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  sku: Joi.string().trim().max(50),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid category ID',
  }),
  brand: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid brand ID',
  }),
  vehicleCompatibility: Joi.array().items(Joi.string().trim()),
  description: Joi.string().allow(''),
  shortDescription: Joi.string().allow('').max(300),
  sellingPrice: Joi.number().min(0),
  costPrice: Joi.number().min(0).allow(null),
  stock: Joi.number().integer().min(0),
  lowStockLimit: Joi.number().integer().min(0),
  weight: Joi.number().min(0).allow(null),
  status: Joi.string().valid('active', 'inactive', 'draft'),
  hsnCode: Joi.string().allow(''),
  gstRate: Joi.number().valid(0, 5, 12, 18, 28).allow(null),
});
