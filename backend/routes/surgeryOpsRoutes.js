import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';
import {
  getSurgeryVisitContext,
  updateSurgeryPlan,
  uploadSurgeryMedia,
  surgeryTransition,
} from '../controllers/surgeryOpsController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/visit/:visitId', getSurgeryVisitContext);
router.patch('/visit/:visitId/plan', updateSurgeryPlan);
router.post(
  '/visit/:visitId/upload',
  uploadMultiple('images', 10),
  uploadSurgeryMedia
);
router.post(
  '/visit/:visitId/transition',
  requirePermission('manage_surgery'),
  surgeryTransition
);

export default router;
