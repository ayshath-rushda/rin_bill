import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { validate } from '../validators/billing.validator.js';
import { paymentSchema } from '../validators/billing.validator.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

router.post('/', auth, rbac('billing.*'), validate(paymentSchema), paymentController.recordPayment);
router.get('/', auth, rbac('billing.*'), paymentController.listPayments);

export default router;
