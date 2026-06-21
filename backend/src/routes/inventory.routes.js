import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import {
  validate,
  validateQuery,
  stockInSchema,
  stockOutSchema,
  adjustSchema,
  historyQuerySchema,
} from '../validators/inventory.validator.js';
import * as inventoryController from '../controllers/inventory.controller.js';

const router = Router();

router.get('/', auth, rbac('inventory.read'), inventoryController.list);
router.get('/low-stock', auth, rbac('inventory.read'), inventoryController.getLowStock);
router.get('/history', auth, rbac('inventory.read'), validateQuery(historyQuerySchema), inventoryController.getHistory);
router.get('/:productId', auth, rbac('inventory.read'), inventoryController.getById);
router.post('/stock-in', auth, rbac('inventory.create'), validate(stockInSchema), inventoryController.stockIn);
router.post('/stock-out', auth, rbac('inventory.create'), validate(stockOutSchema), inventoryController.stockOut);
router.post('/adjust', auth, rbac('inventory.update'), validate(adjustSchema), inventoryController.adjust);

export default router;
