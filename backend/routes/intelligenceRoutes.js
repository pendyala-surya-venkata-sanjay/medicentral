import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePatientAccess } from '../middleware/requirePatientAccess.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  getPatientSummary,
  getSmartTimeline,
  getClinicalAssistant,
  getPatientAlerts,
  smartSearch,
  getOpsInsights,
  getBranchAlerts,
  getPlatformAIOverview,
  analyzeDocument,
} from '../controllers/intelligenceController.js';

const router = express.Router();

router.use(protect);

router.get('/search', attachStaffContext, smartSearch);

router.get(
  '/patient/:patientId/summary',
  attachStaffContext,
  requirePatientAccess,
  getPatientSummary
);
router.get(
  '/patient/:patientId/timeline-smart',
  attachStaffContext,
  requirePatientAccess,
  getSmartTimeline
);
router.get(
  '/patient/:patientId/assistant',
  attachStaffContext,
  requirePatientAccess,
  getClinicalAssistant
);
router.get(
  '/patient/:patientId/alerts',
  attachStaffContext,
  requirePatientAccess,
  getPatientAlerts
);

router.get('/ops/insights', attachStaffContext, requireStaffContext, getOpsInsights);
router.get('/ops/alerts', attachStaffContext, requireStaffContext, getBranchAlerts);

router.get(
  '/platform/overview',
  attachStaffContext,
  requireSuperAdmin,
  getPlatformAIOverview
);

router.post('/documents/analyze', uploadSingle('document'), analyzeDocument);

export default router;
