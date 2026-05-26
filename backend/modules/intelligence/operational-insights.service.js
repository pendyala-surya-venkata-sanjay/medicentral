import HospitalVisit from '../../models/HospitalVisit.js';
import { WORKFLOW_STATES } from '../../../shared/constants/workflow.js';
import { QUEUE_TYPES, WORKFLOW_STATES_BY_QUEUE } from '../../../shared/constants/queues.js';
import { AlertEngineService } from './alert-engine.service.js';

export class OperationalInsightsService {
  static async buildForBranch({ tenantId, branchId, tenantSlug, branchSlug }) {
    const activeFilter = { tenant: tenantId, branch: branchId, workflowState: { $ne: WORKFLOW_STATES.DISCHARGED } };

    const [activeCount, emergencies, billingPending, surgeries, deptLoad] = await Promise.all([
      HospitalVisit.countDocuments(activeFilter),
      HospitalVisit.countDocuments({ ...activeFilter, priority: { $in: ['urgent', 'critical'] } }),
      HospitalVisit.countDocuments({ ...activeFilter, workflowState: WORKFLOW_STATES.BILLING_PENDING }),
      HospitalVisit.countDocuments({
        ...activeFilter,
        workflowState: {
          $in: [
            WORKFLOW_STATES.SURGERY_REQUIRED,
            WORKFLOW_STATES.IN_SURGERY,
            WORKFLOW_STATES.SURGERY_SCHEDULED,
          ],
        },
      }),
      HospitalVisit.aggregate([
        { $match: activeFilter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const queueLoads = {};
    for (const qt of Object.keys(WORKFLOW_STATES_BY_QUEUE)) {
      const states = WORKFLOW_STATES_BY_QUEUE[qt] || [];
      queueLoads[qt] = await HospitalVisit.countDocuments({
        ...activeFilter,
        workflowState: { $in: states },
      });
    }

    const busiestDept = deptLoad[0];
    const longestQueue = Object.entries(queueLoads).sort((a, b) => b[1] - a[1])[0];

    const alerts = await AlertEngineService.scanBranch({
      tenantId,
      branchId,
      tenantSlug,
      branchSlug,
    });

    const insights = [
      busiestDept
        ? { label: 'Busiest department', value: `${busiestDept._id} (${busiestDept.count} active)` }
        : null,
      longestQueue && longestQueue[1] > 0
        ? { label: 'Longest queue', value: `${longestQueue[0]} (${longestQueue[1]})` }
        : null,
      emergencies > 0 ? { label: 'Emergency load', value: `${emergencies} urgent/critical` } : null,
      billingPending > 0 ? { label: 'Billing bottleneck', value: `${billingPending} pending` } : null,
      surgeries > 0 ? { label: 'Surgery load', value: `${surgeries} in surgical pathway` } : null,
    ].filter(Boolean);

    const narrative = insights.length
      ? insights.map((i) => `${i.label}: ${i.value}`).join('. ') + '.'
      : 'Operations within normal parameters for this branch.';

    return {
      source: 'deterministic',
      activeVisits: activeCount,
      emergencies,
      billingPending,
      surgeries,
      queueLoads,
      insights,
      narrative,
      alerts: alerts.slice(0, 10),
    };
  }
}

export default OperationalInsightsService;
