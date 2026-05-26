import { WORKFLOW_STATES } from './workflow.js';

/** Visual pipeline steps for WorkflowPipeline component */
export const VISUAL_PIPELINE = [
  { key: 'reception', label: 'Reception', states: [WORKFLOW_STATES.REGISTERED, WORKFLOW_STATES.WAITING_FOR_PA] },
  { key: 'pa', label: 'PA', states: [WORKFLOW_STATES.PA_REVIEW] },
  { key: 'doctor', label: 'Doctor', states: [WORKFLOW_STATES.WAITING_FOR_DOCTOR, WORKFLOW_STATES.IN_CONSULTATION] },
  { key: 'lab', label: 'Lab', states: [WORKFLOW_STATES.LAB_REQUIRED, WORKFLOW_STATES.LAB_PENDING, WORKFLOW_STATES.LAB_COMPLETED] },
  { key: 'ward', label: 'Ward', states: [WORKFLOW_STATES.ADMISSION_REQUIRED, WORKFLOW_STATES.ADMITTED, WORKFLOW_STATES.UNDER_OBSERVATION] },
  { key: 'surgery', label: 'Surgery', states: [WORKFLOW_STATES.READY_FOR_SURGERY, WORKFLOW_STATES.SURGERY_REQUIRED, WORKFLOW_STATES.SURGERY_SCHEDULED, WORKFLOW_STATES.IN_SURGERY, WORKFLOW_STATES.POST_SURGERY] },
  { key: 'pharmacy', label: 'Pharmacy', states: [WORKFLOW_STATES.PHARMACY_PENDING] },
  { key: 'billing', label: 'Billing', states: [WORKFLOW_STATES.BILLING_PENDING, WORKFLOW_STATES.PAYMENT_COMPLETED] },
  { key: 'discharge', label: 'Discharge', states: [WORKFLOW_STATES.READY_FOR_DISCHARGE, WORKFLOW_STATES.DISCHARGED] },
];

export const getPipelineProgress = (workflowState) => {
  if (!workflowState) return { currentIndex: 0, completedThrough: -1, currentStep: VISUAL_PIPELINE[0] };
  let currentIndex = 0;
  VISUAL_PIPELINE.forEach((step, idx) => {
    if (step.states.includes(workflowState)) currentIndex = idx;
  });
  if (workflowState === WORKFLOW_STATES.DISCHARGED) {
    return { currentIndex: VISUAL_PIPELINE.length - 1, completedThrough: VISUAL_PIPELINE.length - 1, currentStep: VISUAL_PIPELINE.at(-1) };
  }
  return {
    currentIndex,
    completedThrough: currentIndex - 1,
    currentStep: VISUAL_PIPELINE[currentIndex],
    workflowState,
  };
};
