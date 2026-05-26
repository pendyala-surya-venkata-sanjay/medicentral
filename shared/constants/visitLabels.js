/** Human-readable labels — avoid clinical abbreviations in staff UI. */

export const VISIT_TYPE_OPTIONS = [
  { value: 'OP', label: 'Outpatient Department' },
  { value: 'IP', label: 'Inpatient Department' },
];

export const visitTypeLabel = (code) =>
  VISIT_TYPE_OPTIONS.find((o) => o.value === code)?.label || code || 'Outpatient Department';

export const workflowStateLabel = (state) => {
  const map = {
    REGISTERED: 'Registered at reception',
    WAITING_FOR_PA: 'Waiting for physician assistant',
    PA_REVIEW: 'Physician assistant review',
    WAITING_FOR_DOCTOR: 'Waiting for doctor',
    IN_CONSULTATION: 'In consultation',
    LAB_REQUIRED: 'Diagnostics required',
    LAB_PENDING: 'Diagnostics in progress',
    LAB_COMPLETED: 'Diagnostics completed',
    ADMISSION_REQUIRED: 'Admission required',
    ADMITTED: 'Admitted',
    BILLING_PENDING: 'Billing pending',
    READY_FOR_DISCHARGE: 'Ready for discharge',
    DISCHARGED: 'Discharged',
  };
  return map[state] || state?.replace(/_/g, ' ') || '—';
};

export default { VISIT_TYPE_OPTIONS, visitTypeLabel, workflowStateLabel };
