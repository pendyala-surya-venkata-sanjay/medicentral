import { WORKFLOW_STATES, LEGACY_STATUS_TO_WORKFLOW } from '../../../shared/constants/workflow.js';
import { WORKFLOW_STATES_BY_QUEUE, QUEUE_TYPES } from '../../../shared/constants/queues.js';
import { getAvailableTransitions } from './workflow.transitions.js';

/**
 * Workflow engine foundation — validates transitions; full persistence wired in Phase 1.
 */
export class WorkflowEngine {
  static getInitialState() {
    return WORKFLOW_STATES.REGISTERED;
  }

  static mapLegacyStatus(legacyStatus) {
    return LEGACY_STATUS_TO_WORKFLOW[legacyStatus] || WORKFLOW_STATES.REGISTERED;
  }

  static canTransition(fromState, toState, operationalRole) {
    const options = getAvailableTransitions(fromState);
    const match = options.find((t) => t.to === toState);
    if (!match) return { allowed: false, reason: 'Invalid transition' };
    if (match.roles.includes(operationalRole) || operationalRole === 'super_admin') {
      return { allowed: true };
    }
    return { allowed: false, reason: `Role ${operationalRole} cannot perform this transition` };
  }

  static getQueueForState(workflowState) {
    for (const [queueType, states] of Object.entries(WORKFLOW_STATES_BY_QUEUE)) {
      if (states.includes(workflowState)) return queueType;
    }
    return null;
  }

  static getPrimaryQueueTypes() {
    return [
      QUEUE_TYPES.RECEPTION,
      QUEUE_TYPES.PA,
      QUEUE_TYPES.DOCTOR,
      QUEUE_TYPES.LAB,
      QUEUE_TYPES.BILLING,
    ];
  }

  static describeState(workflowState) {
    const queue = this.getQueueForState(workflowState);
    return {
      workflowState,
      queueType: queue,
      transitions: getAvailableTransitions(workflowState),
    };
  }
}

export default WorkflowEngine;
