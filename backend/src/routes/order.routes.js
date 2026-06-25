import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import {
  validate,
  validateParams,
  createOrderSchema,
  orderIdSchema,
  updateStatusSchema,
  assignCourierSchema,
} from '../validators/order.validator.js';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', auth, orderController.list);
router.get('/admin', auth, rbac('order.read'), orderController.adminList);
router.post('/', auth, validate(createOrderSchema), orderController.create);
router.patch('/:id/status', auth, rbac('order.updateStatus'), validate(updateStatusSchema), orderController.updateStatus);
router.patch('/:id/courier', auth, rbac('order.assignCourier'), validate(assignCourierSchema), orderController.assignCourier);
router.get('/:id/tracking', auth, orderController.tracking);
router.get('/:id', auth, validateParams(orderIdSchema), orderController.getById);

export default router;
