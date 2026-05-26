import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePermission } from '../middleware/requirePermission.js';
import {
  getDischargeVisitContext,
  generateDischargeSummary,
  dischargeTransition,
} from '../controllers/dischargeOpsController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/visit/:visitId', getDischargeVisitContext);
router.post('/visit/:visitId/generate-summary', generateDischargeSummary);
router.post(
  '/visit/:visitId/transition',
  requirePermission('approve_discharge'),
  dischargeTransition
);

export default router;
