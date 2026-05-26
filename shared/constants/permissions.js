/**
 * Granular enterprise permissions (Phase 7).
 * Enforced on backend via requirePermission middleware.
 */

export const PERMISSION_KEYS = [
  'view_patient',
  'edit_vitals',
  'approve_discharge',
  'manage_surgery',
  'request_consent',
  'approve_billing',
  'workflow_transition',
  'upload_documents',
  'view_timeline',
  'platform_admin',
];

const OPS = [
  'receptionist',
  'doctor_pa',
  'doctor',
  'lab_supervisor',
  'ward_manager',
  'surgery_head',
  'pharmacist',
  'billing_staff',
  'printer_filing_officer',
];

/** @type {Record<string, string[]>} */
export const ROLE_PERMISSIONS = {
  super_admin: PERMISSION_KEYS,
  tenant_admin: [
    'view_patient',
    'edit_vitals',
    'approve_discharge',
    'manage_surgery',
    'request_consent',
    'approve_billing',
    'workflow_transition',
    'upload_documents',
    'view_timeline',
  ],
  branch_admin: [
    'view_patient',
    'edit_vitals',
    'approve_discharge',
    'manage_surgery',
    'request_consent',
    'approve_billing',
    'workflow_transition',
    'upload_documents',
    'view_timeline',
  ],
  receptionist: ['view_patient', 'request_consent', 'workflow_transition', 'upload_documents', 'view_timeline'],
  doctor_pa: ['view_patient', 'edit_vitals', 'workflow_transition', 'upload_documents', 'view_timeline'],
  doctor: [
    'view_patient',
    'edit_vitals',
    'manage_surgery',
    'request_consent',
    'workflow_transition',
    'upload_documents',
    'view_timeline',
  ],
  lab_supervisor: ['view_patient', 'workflow_transition', 'upload_documents', 'view_timeline'],
  ward_manager: ['view_patient', 'edit_vitals', 'workflow_transition', 'upload_documents', 'view_timeline'],
  surgery_head: ['view_patient', 'manage_surgery', 'workflow_transition', 'upload_documents', 'view_timeline'],
  pharmacist: ['view_patient', 'workflow_transition', 'view_timeline'],
  billing_staff: ['view_patient', 'approve_billing', 'workflow_transition', 'view_timeline'],
  printer_filing_officer: ['view_patient', 'approve_discharge', 'workflow_transition', 'view_timeline'],
  patient: ['view_timeline'],
};

export const roleHasPermission = (operationalRole, permission) => {
  const list = ROLE_PERMISSIONS[operationalRole];
  if (!list) return false;
  if (list.includes('platform_admin')) return true;
  return list.includes(permission);
};

export default { PERMISSION_KEYS, ROLE_PERMISSIONS, roleHasPermission };
