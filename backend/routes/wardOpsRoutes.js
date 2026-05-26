import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import {
  getWardVisitContext,
  updateWardAdmission,
  recordVitals,
  addNursingNote,
  wardTransition,
} from '../controllers/wardOpsController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/visit/:visitId', getWardVisitContext);
router.patch('/visit/:visitId/admission', updateWardAdmission);
router.post('/visit/:visitId/vitals', recordVitals);
router.post('/visit/:visitId/nursing-note', addNursingNote);
router.post('/visit/:visitId/transition', wardTransition);

export default router;
