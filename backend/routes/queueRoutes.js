import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { requireStaffContext } from '../middleware/requireStaffContext.js';
import { getQueue, getQueueMetrics } from '../controllers/queueController.js';

const router = express.Router();

router.use(protect, attachStaffContext, requireStaffContext);

router.get('/metrics', getQueueMetrics);
router.get('/:queueType', getQueue);

export default router;
