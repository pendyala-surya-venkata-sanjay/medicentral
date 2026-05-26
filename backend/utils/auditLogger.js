import { AuditService } from '../modules/audit/audit.service.js';

/**
 * Legacy helper — delegates to enterprise AuditService.
 */
export const logActivity = async (req, action, resource, resourceId, meta = {}) => {
  return AuditService.record({
    req,
    action,
    entity: resource,
    entityId: resourceId,
    meta,
    after: meta,
  });
};

export default logActivity;
