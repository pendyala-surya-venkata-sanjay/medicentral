/** Enterprise audit action catalog — separate from clinical timeline */

export const AUDIT_ACTIONS = {
  WORKFLOW_TRANSITION: 'workflow.transition',
  CONSENT_REQUEST: 'consent.request',
  CONSENT_APPROVE: 'consent.approve',
  CONSENT_DENY: 'consent.deny',
  TIMELINE_VIEW: 'timeline.view',
  RECORD_DOWNLOAD: 'record.download',
  DOCUMENT_UPLOAD: 'document.upload',
  PRESCRIPTION_CREATE: 'prescription.create',
  PRESCRIPTION_UPDATE: 'prescription.update',
  DISCHARGE_COMPLETE: 'discharge.complete',
  ADMIN_PLATFORM_VIEW: 'admin.platform_view',
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_SESSION_REVOKE_ALL: 'auth.session_revoke_all',
};

export default AUDIT_ACTIONS;
