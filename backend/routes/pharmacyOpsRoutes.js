import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import {
  getPharmacyVisitContext,
  loadPrescriptionsToQueue,
  pharmacyTransition,
} from '../controllers/pharmacyOpsController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/visit/:visitId', getPharmacyVisitContext);
router.post('/visit/:visitId/load-prescriptions', loadPrescriptionsToQueue);
router.post('/visit/:visitId/transition', pharmacyTransition);

export default router;
