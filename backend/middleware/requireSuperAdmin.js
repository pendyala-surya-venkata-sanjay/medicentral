import { isPlatformRole } from '../modules/auth/rbac.js';

export const requireSuperAdmin = (req, res, next) => {
  const role = req.operationalRole;
  if (isPlatformRole(role) || req.user?.role === 'admin') {
    return next();
  }
  res.status(403);
  next(new Error('Super Admin access required'));
};
