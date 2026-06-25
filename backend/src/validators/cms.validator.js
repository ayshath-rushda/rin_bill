import Joi from 'joi';

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid ID format',
});

export const createSliderSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Slider title is required',
    'any.required': 'Slider title is required',
  }),
  subtitle: Joi.string().allow('').max(300),
  description: Joi.string().allow('').max(1000),
  buttonText: Joi.string().allow('').max(100),
  buttonUrl: Joi.string().allow('').max(500),
  bannerImage: Joi.string().required().messages({
    'any.required': 'Banner image is required',
  }),
  displayOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
});

export const updateSliderSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  subtitle: Joi.string().allow('').max(300),
  description: Joi.string().allow('').max(1000),
  buttonText: Joi.string().allow('').max(100),
  buttonUrl: Joi.string().allow('').max(500),
  bannerImage: Joi.string(),
  displayOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
});

export const reorderSlidersSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: objectId.required(),
        displayOrder: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items array is required',
    }),
});

export const createBannerSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Banner title is required',
    'any.required': 'Banner title is required',
  }),
  image: Joi.string().required().messages({
    'any.required': 'Banner image is required',
  }),
  url: Joi.string().allow('').max(500),
  position: Joi.string()
    .valid('top', 'middle', 'bottom')
    .required()
    .messages({
      'any.only': 'Position must be top, middle, or bottom',
      'any.required': 'Position is required',
    }),
  isActive: Joi.boolean().default(true),
});

export const updateBannerSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  image: Joi.string(),
  url: Joi.string().allow('').max(500),
  position: Joi.string().valid('top', 'middle', 'bottom'),
  isActive: Joi.boolean(),
});

export const assignFeaturedSchema = Joi.object({
  productId: objectId.required().messages({
    'any.required': 'Product ID is required',
  }),
  section: Joi.string()
    .valid('featured', 'best_seller', 'new_arrival')
    .required()
    .messages({
      'any.only': 'Section must be featured, best_seller, or new_arrival',
      'any.required': 'Section is required',
    }),
  displayOrder: Joi.number().integer().min(0).default(0),
});

export const removeFeaturedSchema = Joi.object({
  productId: objectId.required(),
  section: Joi.string().valid('featured', 'best_seller', 'new_arrival').required(),
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
