import express from 'express';
import { createLabReport, getLabReports } from '../controllers/labController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('doctor', 'staff', 'admin'), uploadSingle('document'), createLabReport);
router.get('/patient', protect, getLabReports);
router.get('/patient/:patientId', protect, getLabReports);

export default router;
