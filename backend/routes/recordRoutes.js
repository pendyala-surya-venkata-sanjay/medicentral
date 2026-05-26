import express from 'express';
import { 
  createRecord, 
  getPatientRecords, 
  updateRecord, 
  deleteRecord 
} from '../controllers/recordController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/create', protect, authorize('doctor'), uploadSingle('document'), createRecord);
router.get('/patient', protect, getPatientRecords);
router.get('/patient/:id', protect, getPatientRecords);
router.put('/update/:id', protect, authorize('doctor'), updateRecord);
router.delete('/delete/:id', protect, authorize('doctor'), deleteRecord);

export default router;
