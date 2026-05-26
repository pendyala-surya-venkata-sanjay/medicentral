/**
 * Cross-hospital consent scopes and access duration (Phase 4).
 */

export const CONSENT_SCOPES = {
  TIMELINE_ONLY: 'timeline_only',
  REPORTS_ONLY: 'reports_only',
  FULL_ACCESS: 'full_access',
};

export const CONSENT_SCOPE_LIST = Object.values(CONSENT_SCOPES);

/** Legacy scope strings mapped to canonical scope level */
export const LEGACY_SCOPE_TO_LEVEL = {
  records: CONSENT_SCOPES.REPORTS_ONLY,
  lab: CONSENT_SCOPES.REPORTS_ONLY,
  prescriptions: CONSENT_SCOPES.FULL_ACCESS,
  timeline: CONSENT_SCOPES.TIMELINE_ONLY,
};

export const ACCESS_DURATION = {
  TEMPORARY: 'temporary',
  PERMANENT: 'permanent',
};

export const DURATION_MS = {
  temporary: 30 * 24 * 60 * 60 * 1000,
  permanent: 365 * 24 * 60 * 60 * 1000,
};

export const normalizeScope = (scopeInput) => {
  if (!scopeInput) return [CONSENT_SCOPES.FULL_ACCESS];
  const arr = Array.isArray(scopeInput) ? scopeInput : [scopeInput];
  const level = arr.find((s) => CONSENT_SCOPE_LIST.includes(s));
  if (level) return [level];
  const mapped = arr.map((s) => LEGACY_SCOPE_TO_LEVEL[s]).filter(Boolean);
  return mapped.length ? [mapped[0]] : [CONSENT_SCOPES.FULL_ACCESS];
};
