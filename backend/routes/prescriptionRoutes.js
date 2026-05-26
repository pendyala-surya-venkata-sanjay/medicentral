import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/me', protect, authorize('patient'), getPrescriptions);
router.get('/patient', protect, getPrescriptions);
router.get('/patient/:patientId', protect, getPrescriptions);
router.put('/:id', protect, authorize('doctor'), updatePrescription);
router.delete('/:id', protect, authorize('doctor'), deletePrescription);

export default router;
