import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { getVisitWorkflow, postTransition } from '../controllers/workflowController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/visit/:visitId', getVisitWorkflow);
router.post(
  '/visit/:visitId/transition',
  requirePermission('workflow_transition'),
  postTransition
);

export default router;
