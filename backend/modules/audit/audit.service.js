import AuditLog from '../../models/AuditLog.js';
import { logger } from '../../utils/logger.js';

/**
 * Immutable enterprise audit trail — NOT clinical timeline.
 */
export class AuditService {
  static async record({
    req,
    action,
    entity,
    entityId,
    before = null,
    after = null,
    meta = {},
  }) {
    try {
      const actor = req?.user;
      const staff = req?.staff;
      const doc = await AuditLog.create({
        user: actor?._id,
        actorEmail: actor?.email,
        actorName: actor?.name,
        operationalRole: req?.operationalRole,
        tenant: req?.tenant?._id || staff?.tenant?._id || staff?.tenant,
        branch: req?.branch?._id || staff?.branch?._id || staff?.branch,
        action,
        resource: entity,
        resourceId: entityId?.toString?.() || String(entityId || ''),
        entity,
        entityId: entityId?.toString?.() || String(entityId || ''),
        before: before ? AuditService.snapshot(before) : undefined,
        after: after ? AuditService.snapshot(after) : undefined,
        meta,
        ip: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || '0.0.0.0',
        userAgent: req?.headers?.['user-agent']?.slice(0, 512),
        immutable: true,
      });
      logger.audit(action, { entity, entityId: doc.entityId, userId: actor?._id });
      return doc;
    } catch (err) {
      logger.error('audit_write_failed', { action, error: err.message });
      return null;
    }
  }

  static snapshot(obj) {
    if (!obj) return null;
    if (typeof obj.toObject === 'function') return obj.toObject();
    if (typeof obj === 'object') {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        return { value: String(obj) };
      }
    }
    return { value: obj };
  }

  static async list({ tenantId, branchId, action, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (tenantId) filter.tenant = tenantId;
    if (branchId) filter.branch = branchId;
    if (action) filter.action = action;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }
}

export default AuditService;
