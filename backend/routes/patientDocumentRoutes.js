import express from 'express';
import {
  uploadPatientDocument,
  getMyDocuments,
  getPatientDocuments,
  deletePatientDocument,
} from '../controllers/patientDocumentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/upload',
  protect,
  authorize('patient'),
  uploadSingle('document'),
  uploadPatientDocument
);
router.get('/my', protect, authorize('patient'), getMyDocuments);
router.get(
  '/patient/:patientId',
  protect,
  authorize('doctor', 'staff', 'admin'),
  getPatientDocuments
);
router.delete('/:id', protect, authorize('patient'), deletePatientDocument);

export default router;
