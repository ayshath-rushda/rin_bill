import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  validate,
  addItemSchema,
  updateItemSchema,
} from '../validators/cart.validator.js';
import * as cartController from '../controllers/cart.controller.js';

const router = Router();

router.get('/', auth, cartController.getCart);
router.post('/items', auth, validate(addItemSchema), cartController.addItem);
router.put('/items/:productId', auth, validate(updateItemSchema), cartController.updateItem);
router.delete('/items/:productId', auth, cartController.removeItem);
router.post('/items/:productId/save-for-later', auth, cartController.toggleSaveForLater);

export default router;
