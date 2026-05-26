import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';

const router = express.Router();

const doctorGate = [protect, attachStaffContext, authorize('doctor')];

router.post('/', ...doctorGate, createPrescription);
router.get('/me', protect, authorize('patient'), getPrescriptions);
router.get('/patient', protect, getPrescriptions);
router.get('/patient/:patientId', protect, getPrescriptions);
router.put('/:id', ...doctorGate, updatePrescription);
router.delete('/:id', ...doctorGate, deletePrescription);

export default router;
