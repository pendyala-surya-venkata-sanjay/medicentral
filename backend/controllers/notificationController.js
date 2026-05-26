import { NotificationService } from '../modules/notifications/notification.service.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const list = await NotificationService.listForUser(req.user._id, {
      unreadOnly: req.query.unread === 'true',
    });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await NotificationService.unreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const count = await NotificationService.markAllRead(req.user._id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const n = await NotificationService.markRead(req.params.id, req.user._id);
    if (!n) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json(n);
  } catch (error) {
    next(error);
  }
};
