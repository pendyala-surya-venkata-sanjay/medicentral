import WorkflowQueueItem from '../../models/platform/WorkflowQueueItem.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import {
  QUEUE_STATUS,
  WORKFLOW_STATES_BY_QUEUE,
  QUEUE_TYPES,
  QUEUE_TYPE_LIST,
} from '../../../shared/constants/queues.js';
import { WorkflowEngine } from '../workflows/workflow.engine.js';

const patientPopulate = {
  path: 'patient',
  populate: { path: 'user', select: 'name email' },
};

/**
 * Queue service — auto-forward on workflow transitions (Phase 1).
 */
export class QueueService {
  static async enqueueForVisit({
    visit,
    patient,
    tenant,
    branch,
    workflowState,
    priority = 'normal',
    status = QUEUE_STATUS.PENDING,
  }) {
    const queueType = WorkflowEngine.getQueueForState(workflowState);
    if (!queueType || !tenant || !branch) return null;

    const existing = await WorkflowQueueItem.findOne({
      visit: visit._id,
      queueType,
      status: { $in: [QUEUE_STATUS.PENDING, QUEUE_STATUS.IN_PROGRESS] },
    });

    if (existing) {
      existing.workflowState = workflowState;
      existing.priority = priority;
      existing.status = status;
      await existing.save();
      return existing;
    }

    return WorkflowQueueItem.create({
      visit: visit._id,
      patient: patient._id || patient,
      tenant: tenant._id || tenant,
      branch: branch._id || branch,
      queueType,
      workflowState,
      priority,
      status,
    });
  }

  static async completeQueuesForVisit(visitId, { exceptQueueType = null } = {}) {
    const filter = {
      visit: visitId,
      status: { $in: [QUEUE_STATUS.PENDING, QUEUE_STATUS.IN_PROGRESS] },
    };
    if (exceptQueueType) filter.queueType = { $ne: exceptQueueType };

    await WorkflowQueueItem.updateMany(filter, {
      status: QUEUE_STATUS.COMPLETED,
      completedAt: new Date(),
    });
  }

  static async listQueue({
    tenantId,
    branchId,
    queueType,
    status,
    limit = 50,
  }) {
    const states = WORKFLOW_STATES_BY_QUEUE[queueType] || [];
    const visitFilter = {
      tenant: tenantId,
      branch: branchId,
      workflowState: { $in: states },
    };

    const visits = await HospitalVisit.find(visitFilter)
      .populate(patientPopulate)
      .populate('tenant', 'slug name')
      .populate('branch', 'slug name city')
      .sort({ priority: -1, checkIn: 1 })
      .limit(limit)
      .lean();

    const items = await WorkflowQueueItem.find({
      tenant: tenantId,
      branch: branchId,
      queueType,
      status: status
        ? status
        : { $in: [QUEUE_STATUS.PENDING, QUEUE_STATUS.IN_PROGRESS] },
    })
      .populate({
        path: 'visit',
        populate: [patientPopulate, { path: 'tenant' }, { path: 'branch' }],
      })
      .populate(patientPopulate)
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit);

    const visitIds = new Set(visits.map((v) => v._id.toString()));
    for (const item of items) {
      if (item.visit?._id) visitIds.add(item.visit._id.toString());
    }

    const mergedVisits =
      visits.length > 0
        ? visits
        : items.map((i) => i.visit).filter(Boolean);

    return { items, visits: mergedVisits, workflowStates: states };
  }

  static async getQueueMetrics({ tenantId, branchId }) {
    const metrics = {};
    for (const queueType of QUEUE_TYPE_LIST) {
      const states = WORKFLOW_STATES_BY_QUEUE[queueType] || [];
      const total = await HospitalVisit.countDocuments({
        tenant: tenantId,
        branch: branchId,
        workflowState: { $in: states },
      });

      const emergencies = await HospitalVisit.countDocuments({
        tenant: tenantId,
        branch: branchId,
        workflowState: { $in: states },
        priority: { $in: ['urgent', 'critical'] },
      });

      const followUps = await HospitalVisit.countDocuments({
        tenant: tenantId,
        branch: branchId,
        workflowState: { $in: states },
        isFollowUp: true,
      });

      metrics[queueType] = {
        total,
        waiting: total,
        emergencies,
        followUps,
      };
    }
    return metrics;
  }

  static getStatesForQueueType(queueType) {
    return WORKFLOW_STATES_BY_QUEUE[queueType] || [];
  }
}

export default QueueService;
