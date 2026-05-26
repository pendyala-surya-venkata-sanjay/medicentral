import Staff from '../../models/platform/Staff.js';
import { resolveOperationalRole } from './rbac.js';

/**
 * Attaches req.staff and req.operationalRole after protect middleware.
 */
export const attachStaffContext = async (req, res, next) => {
  try {
    if (!req.user) return next();
    const staff = await Staff.findOne({ user: req.user._id, isActive: true })
      .populate('tenant', 'slug name')
      .populate('branch', 'slug name city');
    req.staff = staff;
    req.operationalRole = resolveOperationalRole(req.user, staff);
    next();
  } catch (error) {
    next(error);
  }
};

export default attachStaffContext;
