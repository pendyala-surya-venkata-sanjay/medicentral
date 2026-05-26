/**
 * Socket.IO event contracts (foundation — implement handlers in Phase 1).
 */
export const SOCKET_NAMESPACES = {
  PLATFORM: '/platform',
  TENANT: '/tenant',
  QUEUES: '/queues',
};

export const SOCKET_EVENTS = {
  // Workflow
  WORKFLOW_TRANSITION: 'workflow:transition',
  WORKFLOW_UPDATED: 'workflow:updated',

  // Queues
  QUEUE_ITEM_ADDED: 'queue:item:added',
  QUEUE_ITEM_UPDATED: 'queue:item:updated',
  QUEUE_ITEM_REMOVED: 'queue:item:removed',

  // Notifications
  NOTIFICATION: 'notification',
  EMERGENCY_ALERT: 'emergency:alert',

  // Consent / interoperability (Phase 4)
  CONSENT_REQUESTED: 'consent:requested',
  CONSENT_RESOLVED: 'consent:resolved',
  CONSENT_APPROVED: 'consent:approved',
  CROSS_HOSPITAL_ACCESS_GRANTED: 'cross_hospital:access_granted',
  TIMELINE_SHARED: 'timeline:shared',
  TENANT_ACTIVITY: 'tenant:activity',
  SMART_ALERT: 'smart:alert',

  // Phase 3 inpatient
  PATIENT_ADMITTED: 'patient:admitted',
  VITALS_UPDATED: 'vitals:updated',
  SURGERY_SCHEDULED: 'surgery:scheduled',
  SURGERY_COMPLETED: 'surgery:completed',
  PHARMACY_READY: 'pharmacy:ready',
  DISCHARGE_READY: 'discharge:ready',

  // Connection
  JOIN_BRANCH: 'join:branch',
  LEAVE_BRANCH: 'leave:branch',
};

export const buildBranchRoom = (tenantSlug, branchSlug) =>
  `tenant:${tenantSlug}:branch:${branchSlug}`;

export default { SOCKET_EVENTS, SOCKET_NAMESPACES, buildBranchRoom };
