/**
 * Phase 5 — deterministic clinical intelligence (LLM-ready contracts).
 */

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export const ALERT_TYPES = {
  ABNORMAL_VITALS: 'abnormal_vitals',
  ALLERGY: 'allergy',
  MEDICATION: 'medication',
  SURGERY: 'surgery',
  LAB_PENDING: 'lab_pending',
  LAB_OVERDUE: 'lab_overdue',
  BILLING: 'billing',
  EMERGENCY: 'emergency',
  REPEAT_ADMISSION: 'repeat_admission',
  ICU_PLACEHOLDER: 'icu_risk',
  MISSING_REPORT: 'missing_report',
};

export const DOCUMENT_TYPES = [
  'prescription',
  'lab_report',
  'imaging',
  'discharge_summary',
  'insurance',
  'pathology',
  'unknown',
];

export const INTELLIGENCE_DISCLAIMER =
  'Assistive summary only — not a diagnosis. Clinical decisions remain with licensed providers.';
