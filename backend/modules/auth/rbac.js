import {
  ALL_ROLES,
  LEGACY_TO_OPERATIONAL,
  PLATFORM_ROLES,
  TENANT_ROLES,
  OPERATIONAL_ROLES,
} from '../../../shared/constants/roles.js';
import { roleHasPermission, PERMISSION_KEYS } from '../../../shared/constants/permissions.js';

/**
 * Resolve operational role from User + optional Staff profile.
 */
export const resolveOperationalRole = (user, staffProfile = null) => {
  if (staffProfile?.operationalRole) return staffProfile.operationalRole;
  return LEGACY_TO_OPERATIONAL[user?.role] || user?.role;
};

export const isPlatformRole = (role) => PLATFORM_ROLES.includes(role);

export const isTenantAdminRole = (role) => TENANT_ROLES.includes(role);

export const isOperationalRole = (role) => OPERATIONAL_ROLES.includes(role);

export const canAccessTenant = (operationalRole, staffProfile, tenantId) => {
  if (isPlatformRole(operationalRole)) return true;
  if (!staffProfile?.tenant) return false;
  return staffProfile.tenant.toString() === tenantId.toString();
};

export const canAccessBranch = (operationalRole, staffProfile, branchId) => {
  if (isPlatformRole(operationalRole)) return true;
  if (operationalRole === 'tenant_admin') {
    return staffProfile?.tenant != null;
  }
  if (!staffProfile?.branch) return false;
  return staffProfile.branch.toString() === branchId.toString();
};

/**
 * Permission checks for foundation routes (expanded in Phase 1).
 */
/** Legacy permission keys — prefer shared/constants/permissions.js */
export const PERMISSIONS = {
  'foundation:read': [...PLATFORM_ROLES, ...TENANT_ROLES, ...OPERATIONAL_ROLES, 'patient'],
  'tenant:manage': [...PLATFORM_ROLES, 'tenant_admin'],
  'queue:read': [...OPERATIONAL_ROLES, ...TENANT_ROLES, ...PLATFORM_ROLES],
  'workflow:transition': OPERATIONAL_ROLES,
  'consent:approve': ['patient'],
};

export const hasPermission = (operationalRole, permission) => {
  if (PERMISSION_KEYS.includes(permission)) {
    return roleHasPermission(operationalRole, permission);
  }
  const allowed = PERMISSIONS[permission];
  return allowed ? allowed.includes(operationalRole) : false;
};

export const requireOperationalRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.operationalRole || resolveOperationalRole(req.user, req.staff);
    if (!roles.includes(role) && !isPlatformRole(role)) {
      res.status(403);
      return next(new Error(`Role ${role} is not authorized for this action`));
    }
    next();
  };
};

export const getRoleCatalog = () => ({
  all: ALL_ROLES,
  platform: PLATFORM_ROLES,
  tenant: TENANT_ROLES,
  operations: OPERATIONAL_ROLES,
  legacyMapping: LEGACY_TO_OPERATIONAL,
});

export default {
  resolveOperationalRole,
  hasPermission,
  getRoleCatalog,
};
