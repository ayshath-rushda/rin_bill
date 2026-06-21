import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import * as settingsController from '../controllers/settings.controller.js';

const router = Router();

router.get('/', auth, rbac('settings.manage'), settingsController.getAll);
router.get('/:key', settingsController.getByKey);
router.put('/:key', auth, rbac('settings.manage'), settingsController.update);
router.put('/bulk', auth, rbac('settings.manage'), settingsController.updateBulk);

export default router;
