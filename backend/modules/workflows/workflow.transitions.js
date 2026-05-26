import { WORKFLOW_STATES } from '../../../shared/constants/workflow.js';

const OPS = ['receptionist', 'branch_admin', 'tenant_admin', 'super_admin'];
const PA = ['doctor_pa', ...OPS];
const DOC = ['doctor', ...OPS];
const LAB = ['lab_supervisor', ...OPS];
const WARD = ['ward_manager', ...OPS];
const SURG = ['surgery_head', 'doctor', ...OPS];
const PHARM = ['pharmacist', ...OPS];
const BILL = ['billing_staff', ...OPS];
const PRINT = ['printer_filing_officer', 'receptionist', ...OPS];

/**
 * Phase 1–3 transition graph — admission through discharge.
 */
export const WORKFLOW_TRANSITIONS = {
  [WORKFLOW_STATES.REGISTERED]: [
    {
      to: WORKFLOW_STATES.WAITING_FOR_DOCTOR,
      roles: ['receptionist', ...OPS],
      label: 'Send to doctor queue',
      action: 'forward_to_doctor',
    },
    { to: WORKFLOW_STATES.WAITING_FOR_PA, roles: ['receptionist', ...OPS], label: 'Forward to PA', action: 'forward_to_pa' },
  ],
  [WORKFLOW_STATES.WAITING_FOR_PA]: [
    { to: WORKFLOW_STATES.PA_REVIEW, roles: PA, label: 'Start preparation', action: 'start_pa_review' },
  ],
  [WORKFLOW_STATES.PA_REVIEW]: [
    { to: WORKFLOW_STATES.WAITING_FOR_DOCTOR, roles: PA, label: 'Forward to doctor', action: 'forward_to_doctor' },
  ],
  [WORKFLOW_STATES.WAITING_FOR_DOCTOR]: [
    { to: WORKFLOW_STATES.IN_CONSULTATION, roles: DOC, label: 'Accept patient', action: 'accept_patient' },
    { to: WORKFLOW_STATES.IN_CONSULTATION, roles: DOC, label: 'Start consultation', action: 'start_consultation' },
  ],
  [WORKFLOW_STATES.IN_CONSULTATION]: [
    { to: WORKFLOW_STATES.LAB_REQUIRED, roles: DOC, label: 'Order diagnostics', action: 'order_lab' },
    { to: WORKFLOW_STATES.ADMISSION_REQUIRED, roles: DOC, label: 'Request admission', action: 'request_admission' },
    { to: WORKFLOW_STATES.BILLING_PENDING, roles: DOC, label: 'Send to billing', action: 'send_billing' },
    { to: WORKFLOW_STATES.BILLING_PENDING, roles: DOC, label: 'Schedule follow-up', action: 'mark_follow_up' },
    { to: WORKFLOW_STATES.READY_FOR_DISCHARGE, roles: DOC, label: 'Ready for discharge', action: 'ready_discharge' },
  ],
  [WORKFLOW_STATES.LAB_REQUIRED]: [
    { to: WORKFLOW_STATES.LAB_PENDING, roles: LAB, label: 'Start lab work', action: 'start_lab' },
  ],
  [WORKFLOW_STATES.LAB_PENDING]: [
    { to: WORKFLOW_STATES.LAB_COMPLETED, roles: LAB, label: 'Mark lab complete', action: 'complete_lab' },
  ],
  [WORKFLOW_STATES.LAB_COMPLETED]: [
    { to: WORKFLOW_STATES.BILLING_PENDING, roles: [...LAB, ...BILL], label: 'Forward to billing', action: 'forward_to_billing' },
  ],
  [WORKFLOW_STATES.ADMISSION_REQUIRED]: [
    { to: WORKFLOW_STATES.ADMITTED, roles: WARD, label: 'Admit patient', action: 'admit_patient' },
    { to: WORKFLOW_STATES.ADMITTED, roles: WARD, label: 'Emergency admit', action: 'emergency_admit' },
  ],
  [WORKFLOW_STATES.ADMITTED]: [
    { to: WORKFLOW_STATES.UNDER_OBSERVATION, roles: WARD, label: 'Under observation', action: 'start_observation' },
  ],
  [WORKFLOW_STATES.UNDER_OBSERVATION]: [
    { to: WORKFLOW_STATES.READY_FOR_SURGERY, roles: [...WARD, ...DOC], label: 'Ready for surgery', action: 'ready_for_surgery' },
    { to: WORKFLOW_STATES.SURGERY_REQUIRED, roles: [...WARD, ...DOC], label: 'Surgery required', action: 'request_surgery' },
    { to: WORKFLOW_STATES.PHARMACY_PENDING, roles: [...WARD, ...DOC], label: 'Send to pharmacy', action: 'forward_pharmacy' },
    { to: WORKFLOW_STATES.BILLING_PENDING, roles: [...WARD, ...BILL], label: 'Send to billing', action: 'forward_to_billing' },
  ],
  [WORKFLOW_STATES.READY_FOR_SURGERY]: [
    { to: WORKFLOW_STATES.SURGERY_REQUIRED, roles: [...SURG, ...WARD], label: 'Confirm surgery', action: 'confirm_surgery' },
  ],
  [WORKFLOW_STATES.SURGERY_REQUIRED]: [
    { to: WORKFLOW_STATES.SURGERY_SCHEDULED, roles: SURG, label: 'Schedule surgery', action: 'schedule_surgery' },
  ],
  [WORKFLOW_STATES.SURGERY_SCHEDULED]: [
    { to: WORKFLOW_STATES.IN_SURGERY, roles: SURG, label: 'Start surgery', action: 'start_surgery' },
  ],
  [WORKFLOW_STATES.IN_SURGERY]: [
    { to: WORKFLOW_STATES.POST_SURGERY, roles: SURG, label: 'Surgery complete', action: 'complete_surgery' },
  ],
  [WORKFLOW_STATES.POST_SURGERY]: [
    { to: WORKFLOW_STATES.UNDER_OBSERVATION, roles: [...SURG, ...WARD], label: 'Return to ward', action: 'return_observation' },
    { to: WORKFLOW_STATES.PHARMACY_PENDING, roles: [...SURG, ...WARD], label: 'Send to pharmacy', action: 'forward_pharmacy' },
  ],
  [WORKFLOW_STATES.PHARMACY_PENDING]: [
    { to: WORKFLOW_STATES.PHARMACY_PENDING, roles: PHARM, label: 'Dispense medicines', action: 'dispense_medicines' },
    { to: WORKFLOW_STATES.BILLING_PENDING, roles: [...PHARM, ...BILL], label: 'Forward to billing', action: 'forward_to_billing' },
  ],
  [WORKFLOW_STATES.BILLING_PENDING]: [
    { to: WORKFLOW_STATES.PAYMENT_COMPLETED, roles: BILL, label: 'Payment received', action: 'payment_completed' },
  ],
  [WORKFLOW_STATES.PAYMENT_COMPLETED]: [
    { to: WORKFLOW_STATES.READY_FOR_DISCHARGE, roles: [...BILL, 'receptionist', ...OPS], label: 'Ready for discharge', action: 'ready_discharge' },
  ],
  [WORKFLOW_STATES.READY_FOR_DISCHARGE]: [
    { to: WORKFLOW_STATES.DISCHARGED, roles: PRINT, label: 'Digital discharge', action: 'discharge' },
  ],
};

export const getAvailableTransitions = (fromState) => WORKFLOW_TRANSITIONS[fromState] || [];

export const getTransitionByAction = (fromState, action) => {
  const options = getAvailableTransitions(fromState);
  return options.find((t) => t.action === action) || null;
};
