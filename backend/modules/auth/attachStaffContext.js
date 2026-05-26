import Staff from '../../models/platform/Staff.js';
import Doctor from '../../models/Doctor.js';
import { resolveOperationalRole } from './rbac.js';

/**
 * Attaches req.staff, req.doctor (if applicable), and req.operationalRole after protect middleware.
 */
export const attachStaffContext = async (req, res, next) => {
  try {
    if (!req.user) return next();
    const staff = await Staff.findOne({ user: req.user._id, isActive: true })
      .populate('tenant', 'slug name')
      .populate('branch', 'slug name city');

    let doctor = null;
    if (req.user.role === 'doctor' || staff?.operationalRole === 'doctor') {
      doctor = await Doctor.findOne({ user: req.user._id })
        .populate('tenant', 'slug name')
        .populate('branch', 'slug name city');
    }

    req.staff = staff;
    req.doctor = doctor;
    req.operationalRole = resolveOperationalRole(req.user, staff);
    if (req.user.role === 'doctor' && req.operationalRole !== 'doctor') {
      req.operationalRole = 'doctor';
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default attachStaffContext;
