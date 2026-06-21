import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { validate } from '../validators/auth.validator.js';
import { createBrandSchema, updateBrandSchema } from '../validators/brand.validator.js';
import * as brandController from '../controllers/brand.controller.js';

const router = Router();

router.get('/', brandController.getAll);
router.post('/', auth, rbac('brand.*'), validate(createBrandSchema), brandController.create);
router.put('/:id', auth, rbac('brand.*'), validate(updateBrandSchema), brandController.update);
router.delete('/:id', auth, rbac('brand.*'), brandController.remove);

export default router;
