/**
 * Centralized patient timeline event types (global history).
 */

export const TIMELINE_EVENT_TYPES = {
  VISIT: 'visit',
  RECORD: 'record',
  PRESCRIPTION: 'prescription',
  LAB: 'lab',
  SURGERY: 'surgery',
  VITALS: 'vitals',
  BILLING: 'billing',
  ADMISSION: 'admission',
  DISCHARGE: 'discharge',
  PATIENT_UPLOAD: 'patient_upload',
  VOICE: 'voice',
  PREDICTION: 'prediction',
  CONSENT: 'consent',
  WORKFLOW: 'workflow',
};

export const TIMELINE_EVENT_LIST = Object.values(TIMELINE_EVENT_TYPES);

/** Maps legacy timeline aggregator `type` fields → canonical TimelineEvent.type */
export const LEGACY_TIMELINE_TYPE_MAP = {
  record: TIMELINE_EVENT_TYPES.RECORD,
  prescription: TIMELINE_EVENT_TYPES.PRESCRIPTION,
  voice: TIMELINE_EVENT_TYPES.VOICE,
  surgery: TIMELINE_EVENT_TYPES.SURGERY,
  billing: TIMELINE_EVENT_TYPES.BILLING,
  prediction: TIMELINE_EVENT_TYPES.PREDICTION,
  visit: TIMELINE_EVENT_TYPES.VISIT,
  admission: TIMELINE_EVENT_TYPES.ADMISSION,
  discharge: TIMELINE_EVENT_TYPES.DISCHARGE,
  lab: TIMELINE_EVENT_TYPES.LAB,
  patient_upload: TIMELINE_EVENT_TYPES.PATIENT_UPLOAD,
};

export const CONSENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
};
