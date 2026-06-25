import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { upload } from '../config/upload.js';
import {
  validate,
  createSliderSchema,
  updateSliderSchema,
  reorderSlidersSchema,
  createBannerSchema,
  updateBannerSchema,
  assignFeaturedSchema,
} from '../validators/cms.validator.js';
import * as cmsController from '../controllers/cms.controller.js';

const router = Router();

/* Public */
router.get('/sliders', cmsController.getSliders);
router.get('/banners', cmsController.getBanners);
router.get('/featured-products', cmsController.getFeaturedProducts);

/* Admin — Sliders */
router.get('/sliders/all', auth, rbac('cms.*'), cmsController.getAllSliders);
router.post('/sliders', auth, rbac('cms.*'), validate(createSliderSchema), cmsController.createSlider);
router.put('/sliders/reorder', auth, rbac('cms.*'), validate(reorderSlidersSchema), cmsController.reorderSliders);
router.put('/sliders/:id', auth, rbac('cms.*'), validate(updateSliderSchema), cmsController.updateSlider);
router.delete('/sliders/:id', auth, rbac('cms.*'), cmsController.deleteSlider);

/* Admin — Banners */
router.get('/banners/all', auth, rbac('cms.*'), cmsController.getAllBanners);
router.post('/banners', auth, rbac('cms.*'), validate(createBannerSchema), cmsController.createBanner);
router.put('/banners/:id', auth, rbac('cms.*'), validate(updateBannerSchema), cmsController.updateBanner);
router.delete('/banners/:id', auth, rbac('cms.*'), cmsController.deleteBanner);

/* Admin — Featured Products */
router.get('/featured-products/all', auth, rbac('cms.*'), cmsController.getAllFeaturedProducts);
router.post('/featured-products', auth, rbac('cms.*'), validate(assignFeaturedSchema), cmsController.assignFeatured);
router.delete('/featured-products/:id', auth, rbac('cms.*'), cmsController.removeFeatured);

/* Admin — Image Upload */
router.post('/upload', auth, rbac('cms.*'), upload.array('images', 1), cmsController.uploadImage);

export default router;
