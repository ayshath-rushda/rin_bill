import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { validate, validateQuery } from '../validators/report.validator.js';
import * as reportController from '../controllers/report.controller.js';
import {
  salesQuerySchema,
  inventoryMovementQuerySchema,
  ordersQuerySchema,
  topCustomersQuerySchema,
  customerPurchasesQuerySchema,
  exportSalesQuerySchema,
} from '../validators/report.validator.js';

const router = Router();

router.get('/sales', auth, rbac('report.sales'), validateQuery(salesQuerySchema), reportController.getSales);
router.get('/inventory/stock', auth, rbac('inventory.read'), reportController.getInventoryStock);
router.get('/inventory/movement', auth, rbac('inventory.read'), validateQuery(inventoryMovementQuerySchema), reportController.getInventoryMovement);
router.get('/orders', auth, rbac('report.orders'), validateQuery(ordersQuerySchema), reportController.getOrders);
router.get('/customers/top', auth, rbac('customer.read'), validateQuery(topCustomersQuerySchema), reportController.getTopCustomers);
router.get('/customers/purchases', auth, rbac('customer.read'), validateQuery(customerPurchasesQuerySchema), reportController.getCustomerPurchases);
router.get('/export/sales', auth, rbac('report.sales'), validateQuery(exportSalesQuerySchema), reportController.exportSales);
router.get('/export/inventory', auth, rbac('inventory.read'), reportController.exportInventory);

export default router;
