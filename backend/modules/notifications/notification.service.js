import Notification from '../../models/platform/Notification.js';
import User from '../../models/User.js';
import Staff from '../../models/platform/Staff.js';
import { emitQueueUpdate } from './socket.server.js';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from './socket.events.js';

/**
 * Operational notifications — persisted + Socket push.
 */
export class NotificationService {
  static async notifyRole({
    tenant,
    branch,
    operationalRoles,
    type,
    title,
    message,
    payload,
  }) {
    const staffList = await Staff.find({
      tenant: tenant?._id,
      branch: branch?._id,
      operationalRole: { $in: operationalRoles },
      isActive: true,
    }).select('user');

    const userIds = staffList.map((s) => s.user);
    const created = [];

    for (const userId of userIds) {
      const n = await Notification.create({
        user: userId,
        tenant: tenant?._id,
        branch: branch?._id,
        type,
        title,
        message,
        payload,
      });
      created.push(n);
    }

    if (tenant?.slug && branch?.slug) {
      emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.NOTIFICATION, {
        type,
        title,
        message,
        payload,
      });
    }

    return created;
  }

  static async notifyUser({ userId, tenant, branch, type, title, message, payload }) {
    const n = await Notification.create({
      user: userId,
      tenant: tenant?._id,
      branch: branch?._id,
      type,
      title,
      message,
      payload,
    });

    if (tenant?.slug && branch?.slug) {
      emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.NOTIFICATION, {
        userId,
        type,
        title,
        message,
        payload,
      });
    }

    return n;
  }

  static async listForUser(userId, { limit = 30, unreadOnly = false } = {}) {
    const filter = { user: userId };
    if (unreadOnly) filter.read = false;
    return Notification.find(filter).sort({ createdAt: -1 }).limit(limit);
  }

  static async markRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
  }

  static async markAllRead(userId) {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    return this.unreadCount(userId);
  }

  static async unreadCount(userId) {
    return Notification.countDocuments({ user: userId, read: false });
  }
}

export default NotificationService;
