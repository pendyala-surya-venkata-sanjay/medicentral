import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';
import { listAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireSuperAdmin);
router.get('/', listAuditLogs);

export default router;
