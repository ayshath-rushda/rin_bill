import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  validate,
  createAddressSchema,
  updateAddressSchema,
} from '../validators/address.validator.js';
import * as addressController from '../controllers/address.controller.js';

const router = Router();

router.get('/', auth, addressController.list);
router.post('/', auth, validate(createAddressSchema), addressController.create);
router.put('/:id', auth, validate(updateAddressSchema), addressController.update);
router.delete('/:id', auth, addressController.remove);
router.put('/:id/default', auth, addressController.setDefault);

export default router;
