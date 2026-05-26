/**
 * MediCentral OS — modular foundation exports (Phase 0).
 * Legacy routes remain in backend/routes; new architecture lives under modules/.
 */
export { WorkflowEngine } from './workflows/workflow.engine.js';
export { WorkflowTransitionService } from './workflows/workflow-transition.service.js';
export { WORKFLOW_TRANSITIONS, getAvailableTransitions } from './workflows/workflow.transitions.js';
export { QueueService } from './queues/queue.service.js';
export { TenantService, DEMO_TENANTS } from './tenants/tenant.service.js';
export { TimelineService } from './timeline/timeline.service.js';
export * from './auth/rbac.js';
export { attachStaffContext } from './auth/attachStaffContext.js';
export { initSocketFoundation, emitQueueUpdate, getIO } from './notifications/socket.server.js';
export { SOCKET_EVENTS, SOCKET_NAMESPACES } from './notifications/socket.events.js';
