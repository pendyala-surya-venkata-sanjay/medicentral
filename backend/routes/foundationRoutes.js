import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import {
  getArchitecture,
  getWorkflowFoundation,
  getQueueFoundation,
  getTimelineFoundation,
  getRolesFoundation,
  getTenants,
  getSocketFoundation,
  getReusableModules,
} from '../controllers/foundationController.js';

const router = express.Router();

router.get('/architecture', getArchitecture);
router.get('/workflow', getWorkflowFoundation);
router.get('/queues', getQueueFoundation);
router.get('/timeline', getTimelineFoundation);
router.get('/roles', getRolesFoundation);
router.get('/socket', getSocketFoundation);
router.get('/reusable-modules', getReusableModules);

router.get('/tenants', protect, attachStaffContext, getTenants);

export default router;
