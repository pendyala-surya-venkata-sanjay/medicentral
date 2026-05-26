import { roleHasPermission } from '../../shared/constants/permissions.js';
import { resolveOperationalRole } from '../modules/auth/rbac.js';

export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    const role = req.operationalRole || resolveOperationalRole(req.user, req.staff);
    const allowed = permissions.some((p) => roleHasPermission(role, p));
    if (!allowed) {
      res.status(403);
      return next(new Error(`Permission denied: requires ${permissions.join(' or ')}`));
    }
    next();
  };
};

export default requirePermission;
