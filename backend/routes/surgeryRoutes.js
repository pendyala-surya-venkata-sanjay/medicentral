import express from 'express';
import { uploadSurgeryMedia, getSurgeryGallery } from '../controllers/surgeryMediaController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/upload',
  protect,
  authorize('doctor', 'staff', 'admin'),
  uploadMultiple('images', 10),
  uploadSurgeryMedia
);
router.get('/patient/:patientId', protect, getSurgeryGallery);

export default router;
