import express from 'express';
import {
  getHospitals,
  getNearbyHospitals,
  getHospitalById,
  getRegisteredHospitals,
} from '../controllers/hospitalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/nearby', protect, getNearbyHospitals);
router.get('/registered', protect, getRegisteredHospitals);
router.get('/', protect, getHospitals);
router.get('/:id', protect, getHospitalById);

export default router;
