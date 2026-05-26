import express from 'express';
import { getPatientTimeline } from '../controllers/timelineController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/patient', protect, getPatientTimeline);
router.get('/patient/:patientId', protect, getPatientTimeline);

export default router;
