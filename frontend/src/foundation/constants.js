/**
 * UI constants aligned with shared/ (Phase 0).
 * Full shared import via @shared alias when migrating to Next.js.
 */
export const WORKFLOW_STATES = {
  REGISTERED: 'REGISTERED',
  WAITING_FOR_PA: 'WAITING_FOR_PA',
  WAITING_FOR_DOCTOR: 'WAITING_FOR_DOCTOR',
  IN_CONSULTATION: 'IN_CONSULTATION',
  LAB_REQUIRED: 'LAB_REQUIRED',
  LAB_PENDING: 'LAB_PENDING',
  LAB_COMPLETED: 'LAB_COMPLETED',
  ADMISSION_REQUIRED: 'ADMISSION_REQUIRED',
  SURGERY_REQUIRED: 'SURGERY_REQUIRED',
  PHARMACY_PENDING: 'PHARMACY_PENDING',
  BILLING_PENDING: 'BILLING_PENDING',
  READY_FOR_DISCHARGE: 'READY_FOR_DISCHARGE',
  DISCHARGED: 'DISCHARGED',
};

export const QUEUE_TYPES = {
  RECEPTION: 'RECEPTION',
  PA: 'PA',
  DOCTOR: 'DOCTOR',
  LAB: 'LAB',
  BILLING: 'BILLING',
};

export const DEMO_TENANTS = [
  { slug: 'apollo', name: 'Apollo Healthcare' },
  { slug: 'yashoda', name: 'Yashoda Hospitals' },
];
