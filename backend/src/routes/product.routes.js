import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { validate } from '../validators/auth.validator.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { upload } from '../config/cloudinary.js';
import * as productController from '../controllers/product.controller.js';

const router = Router();

router.get('/', productController.list);
router.get('/featured', productController.getFeatured);
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
