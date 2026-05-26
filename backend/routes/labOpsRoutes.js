import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import { getLabVisitContext, uploadLabReport, labTransition } from '../controllers/labOpsController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/visit/:visitId', getLabVisitContext);
router.post('/visit/:visitId/upload', uploadSingle('document'), uploadLabReport);
router.post('/visit/:visitId/transition', labTransition);

export default router;
