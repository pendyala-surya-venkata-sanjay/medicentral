/** @typedef {'super_admin'|'tenant_admin'|'branch_admin'|'receptionist'|'doctor_pa'|'doctor'|'lab_supervisor'|'ward_manager'|'surgery_head'|'pharmacist'|'billing_staff'|'printer_filing_officer'|'patient'} OperationalRole */

export const PLATFORM_ROLES = ['super_admin'];

export const TENANT_ROLES = ['tenant_admin', 'branch_admin'];

export const OPERATIONAL_ROLES = [
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

export const PATIENT_ROLE = 'patient';

export const ALL_ROLES = [
  ...PLATFORM_ROLES,
  ...TENANT_ROLES,
  ...OPERATIONAL_ROLES,
  PATIENT_ROLE,
];

/** Legacy User.role values from existing Mongo auth */
export const LEGACY_ROLES = ['patient', 'doctor', 'staff', 'admin'];

/**
 * Maps legacy auth roles → default operational role (until Staff profile is fully adopted).
 * @type {Record<string, OperationalRole>}
 */
export const LEGACY_TO_OPERATIONAL = {
  patient: 'patient',
  doctor: 'doctor',
  staff: 'receptionist',
  admin: 'tenant_admin',
};

export const ROLE_CATEGORIES = {
  platform: PLATFORM_ROLES,
  tenant: TENANT_ROLES,
  operations: OPERATIONAL_ROLES,
  patient: [PATIENT_ROLE],
};
