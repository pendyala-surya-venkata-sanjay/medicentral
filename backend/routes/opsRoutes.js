import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  getOpsContext,
  searchPatientsQuick,
  createQuickVisit,
  updateVisitPrep,
  uploadVisitDocument,
  getVisitPatientCard,
  getDoctorPatientContext,
  orderLabTests,
  requestAdmission,
  listHospitalDoctors,
  listDoctorScopedQueue,
  listDoctorFollowUpQueue,
  listPendingPrebooks,
  checkInPrebookToDoctorQueue,
  listFollowUpPatients,
  listWardAdmittedPatients,
  lookupPatientById,
} from '../controllers/opsController.js';

const router = express.Router();

router.use(protect, attachStaffContext);

router.get('/context', requireStaffContext, getOpsContext);

router.get('/patients/search', requireStaffContext, searchPatientsQuick);
router.get('/patients/lookup', requireStaffContext, lookupPatientById);
router.get('/hospital/doctors', requireStaffContext, listHospitalDoctors);
router.get('/doctor/queue', requireStaffContext, listDoctorScopedQueue);
router.get('/doctor/follow-ups', requireStaffContext, listDoctorFollowUpQueue);
router.get('/prebooks/pending', requireStaffContext, listPendingPrebooks);
router.post('/prebooks/:prebookId/check-in', requireStaffContext, checkInPrebookToDoctorQueue);
router.get('/follow-up/patients', requireStaffContext, listFollowUpPatients);
router.get('/ward/admitted', requireStaffContext, listWardAdmittedPatients);
router.post('/reception/quick-visit', requireStaffContext, createQuickVisit);

router.get('/visit/:visitId/patient-card', requireStaffContext, getVisitPatientCard);
router.patch('/visit/:visitId/prep', requireStaffContext, updateVisitPrep);
router.post(
  '/visit/:visitId/documents',
  requireStaffContext,
  uploadSingle('document'),
  uploadVisitDocument
);

router.get('/doctor/visit/:visitId', requireStaffContext, getDoctorPatientContext);
router.post('/doctor/visit/:visitId/order-lab', requireStaffContext, orderLabTests);
router.post('/doctor/visit/:visitId/request-admission', requireStaffContext, requestAdmission);

export default router;
