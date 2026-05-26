import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { requirePatientAccess } from '../middleware/requirePatientAccess.js';
import {
  searchPatientsInterop,
  getPatientEcosystemProfile,
  getPatientGlobalTimeline,
} from '../controllers/interopController.js';

const router = express.Router();

router.use(protect, attachStaffContext);

router.get('/search', requireStaffContext, searchPatientsInterop);
router.get(
  '/patient/:patientId/profile',
  requireStaffContext,
  requirePatientAccess,
  getPatientEcosystemProfile
);
router.get(
  '/patient/:patientId/timeline',
  requireStaffContext,
  requirePatientAccess,
  getPatientGlobalTimeline
);

export default router;
