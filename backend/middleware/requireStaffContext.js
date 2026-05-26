import HospitalTenant from '../models/platform/HospitalTenant.js';
import Branch from '../models/platform/Branch.js';
import Doctor from '../models/Doctor.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import { resolveOperationalRole } from '../modules/auth/rbac.js';

export const requireStaffContext = async (req, res, next) => {
  try {
    const role = req.operationalRole || resolveOperationalRole(req.user, req.staff);

    if (role === 'patient') {
      res.status(403);
      throw new Error('Patients cannot access operational endpoints');
    }

    let tenant = null;
    let branch = null;

    if (req.staff?.tenant) {
      tenant =
        req.staff.tenant.slug != null
          ? req.staff.tenant
          : await HospitalTenant.findById(req.staff.tenant);
    }
    if (req.staff?.branch) {
      branch =
        req.staff.branch.slug != null ? req.staff.branch : await Branch.findById(req.staff.branch);
    }

    if ((!tenant || !branch) && (req.doctor?.tenant || req.user?.role === 'doctor')) {
      const doctor =
        req.doctor ||
        (await Doctor.findOne({ user: req.user._id })
          .populate('tenant', 'slug name')
          .populate('branch', 'slug name city'));
      if (doctor?.tenant) {
        tenant =
          doctor.tenant.slug != null ? doctor.tenant : await HospitalTenant.findById(doctor.tenant);
        branch =
          doctor.branch?.slug != null ? doctor.branch : await Branch.findById(doctor.branch);
        req.doctor = doctor;
      }
    }

    if (!tenant || !branch) {
      if (process.env.STRICT_TENANT_SCOPE === 'true') {
        res.status(403);
        throw new Error('Staff must be assigned to a tenant and branch');
      }
      const defaults = await TenantService.getDefaultBranch();
      tenant = defaults.tenant;
      branch = defaults.branch;
    }

    if (!tenant || !branch) {
      res.status(503);
      throw new Error('Hospital tenant not configured. Run npm run seed:foundation');
    }

    req.tenant = tenant;
    req.branch = branch;
    req.operationalRole = role;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireStaffContext;
