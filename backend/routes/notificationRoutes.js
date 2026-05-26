import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMyNotifications,
  markNotificationRead,
  getUnreadCount,
  markAllRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);
router.get('/unread-count', getUnreadCount);
router.post('/read-all', markAllRead);
router.get('/', getMyNotifications);
router.put('/:id/read', markNotificationRead);

export default router;
