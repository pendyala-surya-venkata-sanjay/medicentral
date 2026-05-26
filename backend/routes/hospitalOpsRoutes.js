import express from 'express';
import {
  getHospitalAnalytics,
  createVisit,
  updateVisit,
  getVisits,
  admitPatient,
  dischargePatient,
  getAdmissions,
  getPatientsOverview,
  getStaffOverview,
} from '../controllers/hospitalOpsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('staff', 'admin'));

router.get('/analytics', getHospitalAnalytics);
router.get('/staff', getStaffOverview);
router.get('/patients-overview', getPatientsOverview);
router.get('/visits', getVisits);
router.post('/visits', createVisit);
router.put('/visits/:id', updateVisit);
router.get('/admissions', getAdmissions);
router.post('/admissions', admitPatient);
router.post('/discharges', dischargePatient);

export default router;
