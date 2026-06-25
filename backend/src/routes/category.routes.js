import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { validate } from '../validators/auth.validator.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';
import * as categoryController from '../controllers/category.controller.js';

const router = Router();

router.get('/top', categoryController.getTop);
router.get('/', categoryController.getAllPublic);
router.get('/all', auth, rbac('category.*'), categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);
router.post('/', auth, rbac('category.*'), validate(createCategorySchema), categoryController.create);
router.put('/:id', auth, rbac('category.*'), validate(updateCategorySchema), categoryController.update);
router.delete('/:id', auth, rbac('category.*'), categoryController.remove);

export default router;
