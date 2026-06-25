import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { validate } from '../validators/billing.validator.js';
import { createInvoiceSchema } from '../validators/billing.validator.js';
import * as billingController from '../controllers/billing.controller.js';

const router = Router();

router.get('/search/product', auth, rbac('billing.*'), billingController.searchProducts);
router.get('/search/customers', auth, rbac('billing.*'), billingController.searchCustomers);
router.post('/invoices', auth, rbac('billing.*'), validate(createInvoiceSchema), billingController.createInvoice);
router.get('/invoices', auth, rbac('billing.*'), billingController.listInvoices);
router.get('/invoices/:id/print', auth, rbac('billing.*'), billingController.printInvoice);
router.get('/invoices/:id', auth, rbac('billing.*'), billingController.getInvoice);

export default router;
