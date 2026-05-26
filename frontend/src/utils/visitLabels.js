export const VISIT_TYPE_OPTIONS = [
  { value: 'OP', label: 'Outpatient Department' },
  { value: 'IP', label: 'Inpatient Department' },
];

export const visitTypeLabel = (code) =>
  VISIT_TYPE_OPTIONS.find((o) => o.value === code)?.label || 'Outpatient Department';

export const workflowStateLabel = (state) => {
  const map = {
    REGISTERED: 'Registered at reception',
    WAITING_FOR_DOCTOR: 'Waiting for doctor',
    IN_CONSULTATION: 'In consultation',
    BILLING_PENDING: 'Billing pending',
    READY_FOR_DISCHARGE: 'Ready for discharge',
    DISCHARGED: 'Discharged',
  };
  return map[state] || state?.replace(/_/g, ' ') || '—';
};
