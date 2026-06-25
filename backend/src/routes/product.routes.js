import { Router } from 'express';
import auth from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';
import rbac from '../middleware/rbac.js';
import { validate } from '../validators/auth.validator.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { upload } from '../config/upload.js';
import * as productController from '../controllers/product.controller.js';

const router = Router();

router.get('/', optionalAuth, productController.list);
router.get('/featured', optionalAuth, productController.getFeatured);
router.get('/:slug/related', productController.getRelated);
router.get('/:slug', productController.getBySlug);
router.post('/', auth, rbac('product.*'), validate(createProductSchema), productController.create);
router.put('/:id', auth, rbac('product.*'), validate(updateProductSchema), productController.update);
router.delete('/:id', auth, rbac('product.*'), productController.remove);
router.post(
  '/:id/images',
  auth,
  rbac('product.*'),
  upload.array('images', 10),
  productController.uploadImages
);
router.delete('/:id/images/:imageId', auth, rbac('product.*'), productController.deleteImage);

export default router;
