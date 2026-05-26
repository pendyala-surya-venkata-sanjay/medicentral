import express from 'express';
import { uploadVoiceNote, getVoiceNotes } from '../controllers/voiceNoteController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/upload',
  protect,
  authorize('doctor'),
  uploadSingle('audio'),
  uploadVoiceNote
);
router.get('/patient', protect, getVoiceNotes);
router.get('/patient/:patientId', protect, getVoiceNotes);

export default router;
