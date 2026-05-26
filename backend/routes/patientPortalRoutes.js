import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getPatientCockpit,
  createPatientPrebook,
  cancelPatientPrebook,
  listRegisteredHospitalsForPatient,
} from '../controllers/patientPortalController.js';

const router = express.Router();

router.use(protect, authorize('patient'));

router.get('/cockpit', getPatientCockpit);
router.get('/hospitals', listRegisteredHospitalsForPatient);
router.post('/prebook', createPatientPrebook);
router.delete('/prebook/:id', cancelPatientPrebook);

export default router;
