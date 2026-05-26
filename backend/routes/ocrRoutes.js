import express from 'express';
import { scanPrescription } from '../controllers/ocrController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Route specifically for Doctors to scan uploaded prescriptions
router.post('/scan', protect, authorize('doctor'), uploadSingle('document'), scanPrescription);

export default router;
