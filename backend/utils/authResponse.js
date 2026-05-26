import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Staff from '../models/platform/Staff.js';
import { generateAccessToken, createRefreshToken, REFRESH_COOKIE, refreshCookieOptions } from '../modules/auth/token.service.js';
import { resolveOperationalRole } from '../modules/auth/rbac.js';

export const buildAuthResponse = async (user, { req, res, skipRefresh = false } = {}) => {
  let profile = null;
  if (user.role === 'patient') {
    profile = await Patient.findOne({ user: user._id });
  } else if (user.role === 'doctor') {
    profile = await Doctor.findOne({ user: user._id });
  }

  const staff = await Staff.findOne({ user: user._id, isActive: true })
    .populate('tenant', 'slug name')
    .populate('branch', 'slug name city');
  const operationalRole = resolveOperationalRole(user, staff);

  const accessToken = generateAccessToken(user);
  let refreshToken = null;

  if (req && res && !skipRefresh) {
    refreshToken = await createRefreshToken(user, { req });
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  }

  await user.updateOne({ lastLoginAt: new Date() });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    operationalRole,
    token: accessToken,
    accessToken,
    refreshToken: refreshToken || undefined,
    patientId: profile?.patientId ?? null,
    doctorId: profile?.doctorId ?? null,
    specialization: profile?.specialization ?? null,
    tenantSlug: staff?.tenant?.slug,
    branchSlug: staff?.branch?.slug,
  };
};

export default buildAuthResponse;
