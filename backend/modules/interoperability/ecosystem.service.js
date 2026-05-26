import HospitalTenant from '../../models/platform/HospitalTenant.js';
import Branch from '../../models/platform/Branch.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import ConsentAccess from '../../models/platform/ConsentAccess.js';
import TimelineEvent from '../../models/platform/TimelineEvent.js';
import { CONSENT_STATUS } from '../../../shared/constants/timeline.js';
import { WORKFLOW_STATES } from '../../../shared/constants/workflow.js';

export class EcosystemService {
  static async getTenantOverview() {
    const tenants = await HospitalTenant.find({ isActive: true }).lean();
    const result = [];

    for (const tenant of tenants) {
      const branches = await Branch.find({ tenant: tenant._id, isActive: true }).lean();
      const activeVisits = await HospitalVisit.countDocuments({
        tenant: tenant._id,
        workflowState: { $nin: [WORKFLOW_STATES.DISCHARGED] },
      });
      const surgeriesToday = await HospitalVisit.countDocuments({
        tenant: tenant._id,
        workflowState: {
          $in: [
            WORKFLOW_STATES.SURGERY_REQUIRED,
            WORKFLOW_STATES.SURGERY_SCHEDULED,
            WORKFLOW_STATES.IN_SURGERY,
            WORKFLOW_STATES.POST_SURGERY,
          ],
        },
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      });
      const billingPending = await HospitalVisit.countDocuments({
        tenant: tenant._id,
        workflowState: WORKFLOW_STATES.BILLING_PENDING,
      });
      const emergencies = await HospitalVisit.countDocuments({
        tenant: tenant._id,
        priority: { $in: ['urgent', 'critical'] },
        workflowState: { $ne: WORKFLOW_STATES.DISCHARGED },
      });

      result.push({
        tenant,
        branches,
        metrics: {
          activeVisits,
          surgeriesToday,
          billingPending,
          emergencies,
        },
      });
    }
    return result;
  }

  static async getNetworkAnalytics() {
    const [
      totalPatients,
      activeVisits,
      consentApproved,
      consentPending,
      crossHospitalConsents,
      timelineEvents,
    ] = await Promise.all([
      HospitalVisit.distinct('patient').then((ids) => ids.length),
      HospitalVisit.countDocuments({
        workflowState: { $nin: [WORKFLOW_STATES.DISCHARGED] },
      }),
      ConsentAccess.countDocuments({ status: CONSENT_STATUS.APPROVED }),
      ConsentAccess.countDocuments({ status: CONSENT_STATUS.PENDING }),
      ConsentAccess.find({ status: CONSENT_STATUS.APPROVED })
        .lean()
        .then((rows) =>
          rows.filter(
            (r) =>
              r.grantingTenant &&
              r.requestingTenant &&
              r.grantingTenant.toString() !== r.requestingTenant.toString()
          ).length
        ),
      TimelineEvent.countDocuments({
        occurredAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const deptLoad = await HospitalVisit.aggregate([
      { $match: { workflowState: { $ne: WORKFLOW_STATES.DISCHARGED } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    return {
      totalPatientsWithVisits: totalPatients,
      activeVisits,
      consentApproved,
      consentPending,
      crossHospitalShares: crossHospitalConsents,
      timelineEventsWeek: timelineEvents,
      departmentLoad: deptLoad.map((d) => ({ department: d._id, count: d.count })),
    };
  }

  static async getActivityFeed({ limit = 40 } = {}) {
    const [consents, events] = await Promise.all([
      ConsentAccess.find()
        .populate('requestingTenant', 'name slug')
        .populate('grantingTenant', 'name slug')
        .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean(),
      TimelineEvent.find({ type: { $in: ['consent', 'workflow', 'admission', 'discharge', 'surgery', 'lab'] } })
        .populate('tenant', 'name slug')
        .populate('branch', 'name city')
        .populate({ path: 'patient', populate: { path: 'user', select: 'name patientId' } })
        .sort({ occurredAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const feed = [];

    consents.forEach((c) => {
      feed.push({
        kind: 'consent',
        at: c.updatedAt,
        title:
          c.status === CONSENT_STATUS.APPROVED
            ? `${c.requestingTenant?.name} gained access (approved)`
            : c.status === CONSENT_STATUS.PENDING
              ? `${c.requestingTenant?.name} requested records`
              : `${c.requestingTenant?.name} — ${c.status}`,
        summary: c.grantingTenant?.name
          ? `From ${c.grantingTenant.name} · ${c.scopeLevel || 'full_access'}`
          : c.patient?.user?.name || 'Patient',
        payload: { consentId: c._id, status: c.status },
      });
    });

    events.forEach((e) => {
      feed.push({
        kind: 'timeline',
        at: e.occurredAt,
        title: e.title,
        summary: e.summary,
        tenant: e.tenant?.name,
        branch: e.branch?.name,
        payload: { type: e.type },
      });
    });

    feed.sort((a, b) => new Date(b.at) - new Date(a.at));
    return feed.slice(0, limit);
  }
}

export default EcosystemService;
