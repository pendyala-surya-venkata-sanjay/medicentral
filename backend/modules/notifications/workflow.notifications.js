import { emitQueueUpdate } from './socket.server.js';
import { SOCKET_EVENTS } from './socket.events.js';
import { NotificationService } from './notification.service.js';

const ROLE_BY_QUEUE = {
  PA: ['doctor_pa'],
  DOCTOR: ['doctor'],
  LAB: ['lab_supervisor'],
  WARD: ['ward_manager'],
  SURGERY: ['surgery_head', 'doctor'],
  PHARMACY: ['pharmacist'],
  BILLING: ['billing_staff'],
  RECEPTION: ['receptionist'],
  PRINTING: ['printer_filing_officer', 'receptionist'],
};

export const notifyWorkflowTransition = async ({ tenant, branch, visit, fromState, toState, action }) => {
  const payload = {
    visitId: visit._id?.toString?.() || visit._id,
    patientId: visit.patient?.toString?.() || visit.patient,
    fromState,
    toState,
    action,
    tokenNumber: visit.tokenNumber,
    at: new Date().toISOString(),
  };

  const tenantSlug = tenant?.slug;
  const branchSlug = branch?.slug;
  if (tenantSlug && branchSlug) {
    emitQueueUpdate(tenantSlug, branchSlug, SOCKET_EVENTS.WORKFLOW_UPDATED, payload);
    emitQueueUpdate(tenantSlug, branchSlug, SOCKET_EVENTS.QUEUE_ITEM_UPDATED, payload);
  }

  return payload;
};

export const notifyEmergency = async ({ tenant, branch, visit }) => {
  const payload = { visitId: visit._id, priority: 'critical', tokenNumber: visit.tokenNumber };
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.EMERGENCY_ALERT, payload);
    await NotificationService.notifyRole({
      tenant,
      branch,
      operationalRoles: ['receptionist', 'doctor_pa', 'doctor'],
      type: 'emergency',
      title: 'Emergency patient',
      message: `Token ${visit.tokenNumber || '—'} requires immediate attention`,
      payload,
    });
  }
  return payload;
};

export const notifyPatientForwarded = async ({ tenant, branch, queueType, visit }) => {
  const payload = { queueType, visitId: visit._id, workflowState: visit.workflowState };
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.QUEUE_ITEM_ADDED, payload);
  }

  const roles = ROLE_BY_QUEUE[queueType] || [];
  if (roles.length) {
    await NotificationService.notifyRole({
      tenant,
      branch,
      operationalRoles: roles,
      type: 'patient_forwarded',
      title: 'New patient in your queue',
      message: `Token ${visit.tokenNumber || '—'} forwarded to ${queueType}`,
      payload,
    });
  }
  return payload;
};

export const notifyLabCompleted = async ({ tenant, branch, visit }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['doctor', 'billing_staff'],
    type: 'lab_completed',
    title: 'Lab work completed',
    message: `Results ready for token ${visit.tokenNumber || '—'}`,
    payload: { visitId: visit._id },
  });
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.WORKFLOW_UPDATED, {
      event: 'lab_completed',
      visitId: visit._id,
    });
  }
};

export const notifyPatientAdmitted = async ({ tenant, branch, visit }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['ward_manager', 'doctor'],
    type: 'patient_admitted',
    title: 'Patient admitted',
    message: `Token ${visit.tokenNumber || '—'} — ${visit.inpatient?.wardName || 'ward'}`,
    payload: { visitId: visit._id },
  });
};

export const notifySurgeryScheduled = async ({ tenant, branch, visit }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['surgery_head', 'doctor', 'ward_manager'],
    type: 'surgery_scheduled',
    title: 'Surgery scheduled',
    message: visit.surgery?.procedureName || 'OT procedure scheduled',
    payload: { visitId: visit._id },
  });
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.SURGERY_SCHEDULED, {
      visitId: visit._id,
    });
  }
};

export const notifySurgeryCompleted = async ({ tenant, branch, visit }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['ward_manager', 'doctor', 'pharmacist'],
    type: 'surgery_completed',
    title: 'Surgery completed',
    message: visit.surgery?.procedureName || 'Post-op care',
    payload: { visitId: visit._id },
  });
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.SURGERY_COMPLETED, {
      visitId: visit._id,
    });
  }
};

export const notifyPharmacyReady = async ({ tenant, branch, visit }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['pharmacist'],
    type: 'pharmacy_ready',
    title: 'Pharmacy queue',
    message: `Prescriptions ready for token ${visit.tokenNumber || '—'}`,
    payload: { visitId: visit._id },
  });
  if (tenant?.slug && branch?.slug) {
    emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.PHARMACY_READY, {
      visitId: visit._id,
    });
  }
};

export const notifyDischargeReady = async ({ tenant, branch, visit }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['printer_filing_officer', 'receptionist', 'billing_staff'],
    type: 'discharge_ready',
    title: 'Ready for discharge',
    message: `Digital discharge for token ${visit.tokenNumber || '—'}`,
    payload: { visitId: visit._id },
  });
};

export const notifyBillingPending = async ({ tenant, branch, visit, bill }) => {
  await NotificationService.notifyRole({
    tenant,
    branch,
    operationalRoles: ['billing_staff'],
    type: 'billing_pending',
    title: 'Billing pending',
    message: `Invoice ${bill?.invoiceNumber || ''} — ₹${bill?.totalAmount || 0}`,
    payload: { visitId: visit._id, billId: bill?._id },
  });
};
