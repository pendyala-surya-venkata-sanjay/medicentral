import HospitalVisit from '../../models/HospitalVisit.js';
import ConsentAccess from '../../models/platform/ConsentAccess.js';
import HospitalTenant from '../../models/platform/HospitalTenant.js';
import { CONSENT_STATUS } from '../../../shared/constants/timeline.js';
import { CONSENT_SCOPES, normalizeScope } from '../../../shared/constants/consent.js';
import { isPlatformRole } from '../auth/rbac.js';

const REPORT_TYPES = new Set(['lab', 'record', 'patient_upload', 'surgery']);
const TIMELINE_TYPES = new Set(['workflow', 'visit', 'admission', 'discharge', 'consent', 'vitals']);

export class PatientAccessService {
  static async patientHasLocalVisit(patientId, tenantId) {
    return HospitalVisit.exists({ patient: patientId, tenant: tenantId });
  }

  static async getPatientTenantHistory(patientId) {
    const visits = await HospitalVisit.find({ patient: patientId })
      .populate('tenant', 'slug name')
      .populate('branch', 'slug name city')
      .sort({ checkIn: -1 })
      .lean();

    const byTenant = new Map();
    visits.forEach((v) => {
      const tid = v.tenant?._id?.toString();
      if (!tid) return;
      if (!byTenant.has(tid)) {
        byTenant.set(tid, {
          tenant: v.tenant,
          branches: [],
          visitCount: 0,
          lastVisit: v.checkIn,
        });
      }
      const entry = byTenant.get(tid);
      entry.visitCount += 1;
      if (v.branch && !entry.branches.find((b) => b._id?.toString() === v.branch._id?.toString())) {
        entry.branches.push(v.branch);
      }
    });
    return { visits, hospitals: [...byTenant.values()] };
  }

  static async getActiveConsent({ patientId, requestingTenantId }) {
    return ConsentAccess.findOne({
      patient: patientId,
      requestingTenant: requestingTenantId,
      status: CONSENT_STATUS.APPROVED,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .populate('requestingTenant', 'slug name')
      .populate('grantingTenant', 'slug name');
  }

  /**
   * Tenant-aware access: own patients, approved consent, or platform super admin.
   */
  static async evaluateAccess({ patient, staff, tenant, operationalRole }) {
    if (!patient) return { allowed: false, reason: 'Patient not found' };

    if (isPlatformRole(operationalRole)) {
      return {
        allowed: true,
        reason: 'platform',
        scopeLevel: CONSENT_SCOPES.FULL_ACCESS,
        accessibleTenantIds: null,
      };
    }

    if (!tenant?._id) {
      return { allowed: false, reason: 'Tenant context required' };
    }

    const tenantId = tenant._id;
    const hasLocal = await this.patientHasLocalVisit(patient._id, tenantId);
    if (hasLocal) {
      return {
        allowed: true,
        reason: 'local_visit',
        scopeLevel: CONSENT_SCOPES.FULL_ACCESS,
        accessibleTenantIds: [tenantId.toString()],
      };
    }

    const consent = await this.getActiveConsent({
      patientId: patient._id,
      requestingTenantId: tenantId,
    });

    if (!consent) {
      return { allowed: false, reason: 'consent_required' };
    }

    const { hospitals } = await this.getPatientTenantHistory(patient._id);
    const grantingId = consent.grantingTenant?._id?.toString() || consent.grantingTenant?.toString();
    const accessibleTenantIds = [
      tenantId.toString(),
      ...hospitals.map((h) => h.tenant._id.toString()),
    ];
    if (grantingId && !accessibleTenantIds.includes(grantingId)) {
      accessibleTenantIds.push(grantingId);
    }

    return {
      allowed: true,
      reason: 'consent',
      consent,
      scopeLevel: consent.scopeLevel || normalizeScope(consent.scope)[0],
      accessibleTenantIds: [...new Set(accessibleTenantIds)],
    };
  }

  static filterEventsByScope(events, scopeLevel, accessibleTenantIds) {
    let filtered = events;

    if (accessibleTenantIds) {
      filtered = filtered.filter((e) => {
        const tid =
          e.data?.tenant?._id?.toString() ||
          e.data?.tenant?.toString() ||
          e.tenant?._id?.toString() ||
          e.tenant?.toString();
        return !tid || accessibleTenantIds.includes(tid);
      });
    }

    if (scopeLevel === CONSENT_SCOPES.TIMELINE_ONLY) {
      filtered = filtered.filter((e) => TIMELINE_TYPES.has(e.type));
    } else if (scopeLevel === CONSENT_SCOPES.REPORTS_ONLY) {
      filtered = filtered.filter(
        (e) => REPORT_TYPES.has(e.type) || TIMELINE_TYPES.has(e.type) || e.type === 'consent'
      );
    }

    return filtered;
  }

  static async detectGrantingTenant(patientId, requestingTenantId) {
    const visits = await HospitalVisit.find({ patient: patientId })
      .populate('tenant', 'slug name')
      .sort({ checkIn: -1 });

    const other = visits.find((v) => v.tenant?._id?.toString() !== requestingTenantId.toString());
    return other?.tenant || visits[0]?.tenant || null;
  }

  static async searchPatientsGlobal(query) {
    const Patient = (await import('../../models/Patient.js')).default;
    const User = (await import('../../models/User.js')).default;

    const q = query.trim();
    if (!q) return [];

    const filter = {
      $or: [
        { patientId: new RegExp(q, 'i') },
        { contactNumber: new RegExp(q, 'i') },
        { aadhaarLast4: q.length === 4 ? q : undefined },
      ].filter((f) => Object.values(f).every((v) => v !== undefined)),
    };

    if (q.length >= 2) {
      const users = await User.find({ name: new RegExp(q, 'i') }).select('_id');
      if (users.length) filter.$or.push({ user: { $in: users.map((u) => u._id) } });
    }

    const patients = await Patient.find(filter).populate('user', 'name email').limit(20).lean();

    const results = [];
    for (const p of patients) {
      const { hospitals, visits } = await this.getPatientTenantHistory(p._id);
      results.push({
        patientId: p.patientId,
        name: p.user?.name,
        contactNumber: p.contactNumber,
        hospitals: hospitals.map((h) => ({
          name: h.tenant.name,
          slug: h.tenant.slug,
          branches: h.branches,
          visitCount: h.visitCount,
        })),
        totalVisits: visits.length,
      });
    }
    return results;
  }
}

export default PatientAccessService;
