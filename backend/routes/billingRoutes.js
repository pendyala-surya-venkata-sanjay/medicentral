import express from 'express';
import {
  createBill,
  getBills,
  recordPayment,
  updateBill,
} from '../controllers/billingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('staff', 'admin'),
  uploadSingle('invoice'),
  createBill
);
router.get('/', protect, authorize('staff', 'admin'), getBills);
router.get('/patient', protect, (req, res, next) => getBills(req, res, next));
router.get('/patient/:patientId', protect, getBills);
router.put('/:id/payment', protect, authorize('staff', 'admin'), recordPayment);
router.put('/:id', protect, authorize('staff', 'admin'), uploadSingle('invoice'), updateBill);

export default router;
