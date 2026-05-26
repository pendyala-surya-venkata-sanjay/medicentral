import express from 'express';
import { searchPatients, getPatientByPatientId } from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', protect, authorize('doctor', 'staff', 'admin'), searchPatients);
router.get('/lookup/:patientId', protect, authorize('doctor', 'staff', 'admin'), getPatientByPatientId);

export default router;
