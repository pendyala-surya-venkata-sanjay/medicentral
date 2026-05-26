import { isPlatformRole } from '../auth/rbac.js';

/**
 * Tenant/branch query scoping helpers (Phase 7).
 */
export const scopeVisitQuery = (req, base = {}) => {
  const role = req.operationalRole;
  if (isPlatformRole(role)) return { ...base };
  if (!req.tenant?._id) return { ...base, _id: null };
  const q = { ...base, tenant: req.tenant._id };
  if (req.branch?._id && role !== 'tenant_admin') {
    q.branch = req.branch._id;
  }
  return q;
};

export const scopeQueueQuery = (req, base = {}) => {
  const role = req.operationalRole;
  if (isPlatformRole(role)) return { ...base };
  if (!req.tenant?._id) return { ...base, tenant: null };
  return {
    ...base,
    tenant: req.tenant._id,
    branch: req.branch?._id || base.branch,
  };
};

export const assertTenantAccess = (req, resourceTenantId, resourceBranchId = null) => {
  const role = req.operationalRole;
  if (isPlatformRole(role)) return true;
  if (!req.tenant?._id) return false;
  if (resourceTenantId?.toString() !== req.tenant._id.toString()) return false;
  if (
    resourceBranchId &&
    req.branch?._id &&
    role !== 'tenant_admin' &&
    resourceBranchId.toString() !== req.branch._id.toString()
  ) {
    return false;
  }
  return true;
};

export default { scopeVisitQuery, scopeQueueQuery, assertTenantAccess };
