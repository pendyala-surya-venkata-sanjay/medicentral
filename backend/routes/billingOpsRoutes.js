import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePermission } from '../middleware/requirePermission.js';
import {
  getBillingVisitContext,
  billingTransition,
  getBillingQueueSummary,
} from '../controllers/billingOpsController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/queue', getBillingQueueSummary);
router.get('/visit/:visitId', getBillingVisitContext);
router.post(
  '/visit/:visitId/transition',
  requirePermission('approve_billing'),
  billingTransition
);

export default router;
