import HospitalVisit from '../../models/HospitalVisit.js';
import Patient from '../../models/Patient.js';
import Doctor from '../../models/Doctor.js';
import Branch from '../../models/platform/Branch.js';
import HospitalTenant from '../../models/platform/HospitalTenant.js';
import { WorkflowEngine } from './workflow.engine.js';
import { getTransitionByAction, getAvailableTransitions } from './workflow.transitions.js';
import { WORKFLOW_STATES } from '../../../shared/constants/workflow.js';
import { QueueService } from '../queues/queue.service.js';
import { TimelineService } from '../timeline/timeline.service.js';
import {
  notifyWorkflowTransition,
  notifyPatientForwarded,
  notifyLabCompleted,
  notifyBillingPending,
  notifyPatientAdmitted,
  notifySurgeryScheduled,
  notifySurgeryCompleted,
  notifyPharmacyReady,
  notifyDischargeReady,
} from '../notifications/workflow.notifications.js';
import { VisitBillingService } from '../billing/visit-billing.service.js';
import { PharmacyOpsService } from '../pharmacy/pharmacy-ops.service.js';
import { DischargeOpsService } from '../discharge/discharge-ops.service.js';
import { WardOpsService } from '../ward/ward-ops.service.js';
import { SurgeryOpsService } from '../surgery/surgery-ops.service.js';
import { emitQueueUpdate } from '../notifications/socket.server.js';
import { SOCKET_EVENTS } from '../notifications/socket.events.js';
import { AuditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../audit/audit.actions.js';
import { assertTenantAccess } from '../tenants/tenant-scope.js';

const LEGACY_FROM_WORKFLOW = {
  [WORKFLOW_STATES.REGISTERED]: 'waiting',
  [WORKFLOW_STATES.WAITING_FOR_PA]: 'waiting',
  [WORKFLOW_STATES.PA_REVIEW]: 'waiting',
  [WORKFLOW_STATES.WAITING_FOR_DOCTOR]: 'waiting',
  [WORKFLOW_STATES.IN_CONSULTATION]: 'consultation',
  [WORKFLOW_STATES.LAB_REQUIRED]: 'waiting',
  [WORKFLOW_STATES.LAB_PENDING]: 'waiting',
  [WORKFLOW_STATES.LAB_COMPLETED]: 'waiting',
  [WORKFLOW_STATES.ADMISSION_REQUIRED]: 'waiting',
  [WORKFLOW_STATES.ADMITTED]: 'consultation',
  [WORKFLOW_STATES.UNDER_OBSERVATION]: 'consultation',
  [WORKFLOW_STATES.READY_FOR_SURGERY]: 'consultation',
  [WORKFLOW_STATES.SURGERY_REQUIRED]: 'consultation',
  [WORKFLOW_STATES.SURGERY_SCHEDULED]: 'consultation',
  [WORKFLOW_STATES.IN_SURGERY]: 'consultation',
  [WORKFLOW_STATES.POST_SURGERY]: 'consultation',
  [WORKFLOW_STATES.PHARMACY_PENDING]: 'waiting',
  [WORKFLOW_STATES.BILLING_PENDING]: 'waiting',
  [WORKFLOW_STATES.PAYMENT_COMPLETED]: 'completed',
  [WORKFLOW_STATES.READY_FOR_DISCHARGE]: 'completed',
  [WORKFLOW_STATES.DISCHARGED]: 'completed',
};

const TIMELINE_TITLES = {
  forward_to_pa: 'Forwarded to PA preparation',
  start_pa_review: 'PA preparation started',
  forward_to_doctor: 'Ready for doctor consultation',
  accept_patient: 'Patient accepted by doctor',
  start_consultation: 'Consultation started',
  order_lab: 'Diagnostics ordered',
  send_billing: 'Sent to billing',
  start_lab: 'Lab processing started',
  complete_lab: 'Lab diagnostics completed',
  forward_to_billing: 'Forwarded to billing',
  payment_completed: 'Payment completed',
  ready_discharge: 'Ready for discharge',
  discharge: 'Patient discharged',
  request_admission: 'Admission requested',
  admit_patient: 'Patient admitted',
  emergency_admit: 'Emergency admission',
  start_observation: 'Under observation',
  ready_for_surgery: 'Ready for surgery',
  request_surgery: 'Surgery required',
  confirm_surgery: 'Surgery confirmed',
  schedule_surgery: 'Surgery scheduled',
  start_surgery: 'Surgery in progress',
  complete_surgery: 'Surgery completed',
  return_observation: 'Returned to ward observation',
  forward_pharmacy: 'Sent to pharmacy',
  dispense_medicines: 'Medicines dispensed',
  mark_follow_up: 'Scheduled for follow-up',
};

const provenanceTitle = (tenant, branch, title) => {
  const t = tenant?.name || tenant?.slug || 'Hospital';
  const b = branch?.name || branch?.city || '';
  return `${t}${b ? ` ${b}` : ''} — ${title}`;
};

export class WorkflowTransitionService {
  static async loadVisit(visitId) {
    const visit = await HospitalVisit.findById(visitId)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate('tenant')
      .populate('branch');
    if (!visit) {
      const err = new Error('Visit not found');
      err.status = 404;
      throw err;
    }
    return visit;
  }

  static async resolveTenantBranch(visit) {
    let tenant = visit.tenant;
    let branch = visit.branch;
    if (tenant && !tenant.slug) tenant = await HospitalTenant.findById(tenant);
    if (branch && !branch.slug) branch = await Branch.findById(branch);
    return { tenant, branch };
  }

  static timelineTypeForAction(action, targetState) {
    if (action?.includes('lab')) return 'lab';
    if (action?.includes('billing') || action?.includes('payment')) return 'billing';
    if (action?.includes('admit') || action?.includes('admission') || action?.includes('observation')) {
      return 'admission';
    }
    if (action?.includes('surgery')) return 'surgery';
    if (action?.includes('pharmacy') || action === 'dispense_medicines') return 'prescription';
    if (action === 'discharge' || action === 'ready_discharge') return 'discharge';
    return 'workflow';
  }

  static async applyTransitionSideEffects({
    visit,
    patient,
    tenant,
    branch,
    fromState,
    targetState,
    action,
    meta,
    req,
  }) {
    if (action === 'order_lab' && meta?.tests?.length) {
      visit.labOrders = meta.tests.map((t) => ({
        testName: t.testName || t.name,
        category: t.category || 'pathology',
        instructions: t.instructions || meta.labInstructions || visit.labInstructions,
        estimatedAmount: t.estimatedAmount,
        status: 'ordered',
      }));
      if (meta.labInstructions) visit.labInstructions = meta.labInstructions;
      await visit.save();
    }

    if (action === 'complete_lab') {
      (visit.labOrders || []).forEach((o) => {
        o.status = 'completed';
      });
      await visit.save();
    }

    if (
      targetState === WORKFLOW_STATES.BILLING_PENDING ||
      action === 'forward_to_billing' ||
      action === 'send_billing' ||
      action === 'mark_follow_up'
    ) {
      const bill = await VisitBillingService.ensureVisitBill({
        visit,
        patient,
        createdBy: req?.user,
      });
      await notifyBillingPending({ tenant, branch, visit, bill });
    }

    if (action === 'mark_follow_up') {
      visit.followUpRequired = true;
      await visit.save();
    }

    if (action === 'send_billing' && meta?.dischargeRequested) {
      visit.dischargeRequested = true;
      await visit.save();
    }

    if (action === 'payment_completed' && visit.billingSummary?.billId) {
      await VisitBillingService.markPaid(visit.billingSummary.billId, {
        method: meta?.paymentMethod || 'cash',
        reference: meta?.reference,
        receivedBy: req?.user?._id,
      });
    }

    if (action === 'complete_lab' || targetState === WORKFLOW_STATES.LAB_COMPLETED) {
      await notifyLabCompleted({ tenant, branch, visit });
    }

    if (action === 'request_admission') {
      visit.visitType = 'IP';
      if (meta?.wardName) {
        visit.inpatient = { ...(visit.inpatient || {}), wardName: meta.wardName };
      }
      if (meta?.emergency) visit.priority = 'critical';
      await visit.save();
    }

    if (action === 'admit_patient' || action === 'emergency_admit') {
      visit.visitType = 'IP';
      visit.inpatient = {
        ...(visit.inpatient?.toObject?.() || visit.inpatient || {}),
        admissionType: action === 'emergency_admit' ? 'emergency' : meta?.admissionType || 'planned',
        admittedAt: new Date(),
        wardName: meta?.wardName || visit.inpatient?.wardName || 'General Ward',
        bedNumber: meta?.bedNumber,
        roomNumber: meta?.roomNumber,
        icu: meta?.icu || action === 'emergency_admit',
      };
      if (action === 'emergency_admit') visit.priority = 'critical';
      await visit.save();
      await notifyPatientAdmitted({ tenant, branch, visit });
      if (tenant?.slug && branch?.slug) {
        emitQueueUpdate(tenant.slug, branch.slug, SOCKET_EVENTS.PATIENT_ADMITTED, {
          visitId: visit._id,
        });
      }
    }

    if (action === 'start_observation' && meta?.observationNotes) {
      visit.inpatient = { ...(visit.inpatient || {}), observationNotes: meta.observationNotes };
      await visit.save();
    }

    if (['request_surgery', 'ready_for_surgery', 'confirm_surgery'].includes(action)) {
      visit.surgery = {
        ...(visit.surgery?.toObject?.() || visit.surgery || {}),
        procedureName: meta?.procedureName || visit.surgery?.procedureName,
        preOpNotes: meta?.preOpNotes || visit.surgery?.preOpNotes,
        status: 'required',
      };
      await visit.save();
    }

    if (action === 'schedule_surgery') {
      await SurgeryOpsService.updateSurgeryPlan({
        visit,
        patient,
        tenant,
        branch,
        body: {
          ...meta,
          status: 'scheduled',
          scheduledAt: meta?.scheduledAt || new Date(),
        },
      });
      visit.surgery.status = 'scheduled';
      await visit.save();
      await notifySurgeryScheduled({ tenant, branch, visit });
    }

    if (action === 'start_surgery') {
      visit.surgery = { ...(visit.surgery || {}), status: 'in_progress' };
      await visit.save();
    }

    if (action === 'complete_surgery') {
      visit.surgery = {
        ...(visit.surgery || {}),
        status: 'completed',
        postOpNotes: meta?.postOpNotes || visit.surgery?.postOpNotes,
      };
      await visit.save();
      await notifySurgeryCompleted({ tenant, branch, visit });
    }

    if (action === 'forward_pharmacy') {
      await PharmacyOpsService.loadFromPrescriptions({ visit, patient });
      await notifyPharmacyReady({ tenant, branch, visit });
    }

    if (action === 'dispense_medicines') {
      await PharmacyOpsService.dispenseAll({ visit, patient, tenant, branch, staff: req?.staff });
    }

    if (targetState === WORKFLOW_STATES.READY_FOR_DISCHARGE || action === 'ready_discharge') {
      await DischargeOpsService.generateDischargePacket({ visit, patient, tenant, branch });
      await notifyDischargeReady({ tenant, branch, visit });
    }

    if (action === 'discharge' && targetState === WORKFLOW_STATES.DISCHARGED) {
      await DischargeOpsService.archiveVisit({ visit, patient, tenant, branch });
    }

    if (meta?.inpatient) {
      await WardOpsService.updateAdmission({
        visit,
        patient,
        tenant,
        branch,
        body: meta.inpatient,
      });
    }

    if (meta?.surgery) {
      await SurgeryOpsService.updateSurgeryPlan({
        visit,
        patient,
        tenant,
        branch,
        body: meta.surgery,
      });
    }
  }

  static async transition({
    visitId,
    toState,
    action,
    req,
    operationalRole,
    notes,
    meta = {},
  }) {
    const visit = await this.loadVisit(visitId);
    const fromState = visit.workflowState || WORKFLOW_STATES.REGISTERED;

    let targetState = toState;
    if (action) {
      const byAction = getTransitionByAction(fromState, action);
      if (!byAction) {
        const err = new Error(`Invalid action "${action}" for state ${fromState}`);
        err.status = 400;
        throw err;
      }
      targetState = byAction.to;
    }

    if (!targetState) {
      const err = new Error('Target workflow state is required');
      err.status = 400;
      throw err;
    }

    const check = WorkflowEngine.canTransition(fromState, targetState, operationalRole);
    if (!check.allowed) {
      const err = new Error(check.reason);
      err.status = 403;
      throw err;
    }

    const { tenant, branch } = await this.resolveTenantBranch(visit);

    if (req && !assertTenantAccess(req, tenant?._id, branch?._id)) {
      const err = new Error('Tenant scope violation for workflow transition');
      err.status = 403;
      throw err;
    }

    const patient = visit.patient?._id ? visit.patient : await Patient.findById(visit.patient);

    const doctorOutcomeActions = ['send_billing', 'mark_follow_up', 'ready_discharge'];
    if (
      fromState === WORKFLOW_STATES.IN_CONSULTATION &&
      doctorOutcomeActions.includes(action) &&
      !visit.hasDoctorPrescription
    ) {
      const err = new Error('Submit a prescription before sending the patient to follow-up or discharge');
      err.status = 400;
      throw err;
    }

    await QueueService.completeQueuesForVisit(visit._id);

    visit.workflowState = targetState;
    visit.currentQueueType = WorkflowEngine.getQueueForState(targetState);

    if (notes) {
      if ([WORKFLOW_STATES.PA_REVIEW, WORKFLOW_STATES.WAITING_FOR_PA].includes(fromState)) {
        visit.paPrepNotes = notes;
      } else if ([WORKFLOW_STATES.IN_CONSULTATION, WORKFLOW_STATES.LAB_REQUIRED].includes(fromState)) {
        visit.consultationNotes = notes;
      } else if ([WORKFLOW_STATES.LAB_PENDING, WORKFLOW_STATES.LAB_COMPLETED].includes(targetState)) {
        visit.labInstructions = (visit.labInstructions || '') + (visit.labInstructions ? '\n' : '') + notes;
      } else {
        visit.notes = (visit.notes || '') + (visit.notes ? '\n' : '') + notes;
      }
    }

    if (meta.vitals) visit.vitals = { ...visit.vitals?.toObject?.() || visit.vitals, ...meta.vitals };
    if (meta.symptomNotes) visit.symptomNotes = meta.symptomNotes;
    if (meta?.diagnosisSummary) visit.diagnosisSummary = meta.diagnosisSummary;
    if (meta.labInstructions) visit.labInstructions = meta.labInstructions;
    if (action === 'mark_follow_up') visit.followUpRequired = true;
    if (action === 'send_billing' && meta?.dischargeRequested) visit.dischargeRequested = true;
    if (action === 'ready_discharge') visit.dischargeRequested = true;

    // Doctor queue ownership: once accepted/consult started, bind visit to logged-in doctor.
    if (['accept_patient', 'start_consultation'].includes(action) && req?.user?._id) {
      const doctorProfile = await Doctor.findOne({ user: req.user._id }).select('_id');
      if (doctorProfile?._id) visit.assignedDoctor = doctorProfile._id;
    }

    if (LEGACY_FROM_WORKFLOW[targetState]) visit.status = LEGACY_FROM_WORKFLOW[targetState];

    if (targetState === WORKFLOW_STATES.IN_CONSULTATION) visit.checkIn = visit.checkIn || new Date();
    if (targetState === WORKFLOW_STATES.DISCHARGED) {
      visit.checkOut = new Date();
      visit.timelineOpen = false;
      visit.timelineClosedAt = visit.timelineClosedAt || new Date();
    }

    await visit.save();

    await this.applyTransitionSideEffects({
      visit,
      patient,
      tenant,
      branch,
      fromState,
      targetState,
      action,
      meta,
      req,
    });

    const queueStatus =
      targetState === WORKFLOW_STATES.PA_REVIEW || targetState === WORKFLOW_STATES.IN_CONSULTATION
        ? 'IN_PROGRESS'
        : 'PENDING';

    const queueItem = await QueueService.enqueueForVisit({
      visit,
      patient,
      tenant,
      branch,
      workflowState: targetState,
      priority: visit.priority,
      status: queueStatus,
    });

    const baseTitle = TIMELINE_TITLES[action] || `Workflow → ${targetState}`;
    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: this.timelineTypeForAction(action, targetState),
      title: provenanceTitle(tenant, branch, baseTitle),
      summary: notes || `${fromState} → ${targetState}`,
      payload: { fromState, toState: targetState, action, meta },
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    if (req) {
      await AuditService.record({
        req,
        action: AUDIT_ACTIONS.WORKFLOW_TRANSITION,
        entity: 'hospital_visit',
        entityId: visit._id,
        before: { workflowState: fromState },
        after: { workflowState: targetState, action },
        meta: { action, patientId: patient?.patientId },
      });
    }

    await notifyWorkflowTransition({ tenant, branch, visit, fromState, toState: targetState, action });

    if (queueItem?.queueType) {
      await notifyPatientForwarded({ tenant, branch, queueType: queueItem.queueType, visit });
    }

    if (action === 'complete_lab' && targetState !== WORKFLOW_STATES.BILLING_PENDING) {
      const auto = await this.transition({
        visitId: visit._id,
        action: 'forward_to_billing',
        req,
        operationalRole: operationalRole || 'lab_supervisor',
        notes: 'Auto-forward after lab completion',
      });
      return auto;
    }

    return {
      visit: await this.loadVisit(visit._id),
      queueItem,
      transition: { fromState, toState: targetState, action },
    };
  }

  static getAvailableForVisit(visit, operationalRole) {
    const fromState = visit.workflowState || WORKFLOW_STATES.REGISTERED;
    const options = getAvailableTransitions(fromState);
    return options.filter(
      (t) => t.roles.includes(operationalRole) || operationalRole === 'super_admin'
    );
  }
}

export default WorkflowTransitionService;
