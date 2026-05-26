import express from 'express';
import { getDoctorStats, getPatientStats } from '../controllers/statsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/doctor', protect, authorize('doctor'), getDoctorStats);
router.get('/patient', protect, authorize('patient'), getPatientStats);

export default router;
