import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Staff from '../models/platform/Staff.js';
import { buildAuthResponse } from '../utils/authResponse.js';
import { generatePatientId, generateDoctorId } from '../utils/idGenerator.js';
import { resolveOperationalRole } from '../modules/auth/rbac.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import {
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  REFRESH_COOKIE,
  refreshCookieOptions,
} from '../modules/auth/token.service.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AUDIT_ACTIONS } from '../modules/audit/audit.actions.js';

export const registerUser = async (req, res, next) => {
  let createdUser = null;
  try {
    const { name, email, password, role } = req.body;
    const allowed = ['patient', 'doctor', 'staff'];
    const safeRole = allowed.includes(role) ? role : 'patient';

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    createdUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: safeRole,
    });

    if (createdUser.role === 'patient') {
      const patientId = await generatePatientId();
      const aadhaar = req.body.aadhaar?.replace(/\D/g, '');
      await Patient.create({
        user: createdUser._id,
        patientId,
        age: req.body.age ? Number(req.body.age) : undefined,
        gender: req.body.gender,
        bloodGroup: req.body.bloodGroup || undefined,
        contactNumber: req.body.contactNumber?.trim(),
        aadhaarLast4: aadhaar?.length >= 4 ? aadhaar.slice(-4) : undefined,
        address: {
          line1: req.body.addressLine1,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state,
          pincode: req.body.pincode,
        },
        emergencyContact: {
          name: req.body.emergencyName,
          phone: req.body.emergencyPhone,
          relation: req.body.emergencyRelation,
        },
        guardian: {
          name: req.body.guardianName,
          phone: req.body.guardianPhone,
          relation: req.body.guardianRelation,
        },
      });
    } else if (createdUser.role === 'doctor') {
      const tenantSlug = req.body.tenantSlug?.trim().toLowerCase();
      const branchSlug = req.body.branchSlug?.trim().toLowerCase();
      if (!tenantSlug || !branchSlug) {
        res.status(400);
        throw new Error('Hospital and branch are required for doctor registration');
      }
      const { tenant, branch } = await TenantService.resolveTenantBranch(tenantSlug, branchSlug);
      if (!tenant || !branch) {
        res.status(400);
        throw new Error('Invalid hospital or branch');
      }
      const doctorId = await generateDoctorId();
      await Doctor.create({
        user: createdUser._id,
        doctorId,
        specialization: req.body.specialization?.trim() || 'General Medicine',
        department: req.body.department?.trim() || req.body.specialization?.trim() || 'General Medicine',
        consultationFee: req.body.consultationFee ? Number(req.body.consultationFee) : undefined,
        qualification: req.body.qualification,
        tenant: tenant._id,
        branch: branch._id,
      });
      await Staff.create({
        user: createdUser._id,
        operationalRole: 'doctor',
        tenant: tenant._id,
        branch: branch._id,
        department: req.body.department?.trim() || 'General Medicine',
      });
    } else if (createdUser.role === 'staff') {
      const tenantSlug = req.body.tenantSlug?.trim().toLowerCase();
      const branchSlug = req.body.branchSlug?.trim().toLowerCase();
      if (!tenantSlug || !branchSlug) {
        res.status(400);
        throw new Error('Hospital and branch are required for staff registration');
      }
      const { tenant, branch } = await TenantService.resolveTenantBranch(tenantSlug, branchSlug);
      if (!tenant || !branch) {
        res.status(400);
        throw new Error('Invalid hospital or branch');
      }
      const allowedRoles = [
        'receptionist',
        'doctor_pa',
        'lab_supervisor',
        'billing_staff',
        'ward_manager',
        'pharmacist',
        'surgery_head',
        'printer_filing_officer',
      ];
      const opRole = allowedRoles.includes(req.body.operationalRole)
        ? req.body.operationalRole
        : 'receptionist';
      await Staff.create({
        user: createdUser._id,
        operationalRole: opRole,
        tenant: tenant._id,
        branch: branch._id,
        department: req.body.department?.trim(),
      });
    }

    const response = await buildAuthResponse(createdUser, { req, res });
    if (createdUser.role === 'patient' && !response.patientId) {
      res.status(500);
      throw new Error('Patient profile failed to initialize. Please contact support.');
    }
    res.status(201).json(response);
  } catch (error) {
    if (createdUser?._id) {
      await Patient.deleteOne({ user: createdUser._id }).catch(() => {});
      await Doctor.deleteOne({ user: createdUser._id }).catch(() => {});
      await Staff.deleteOne({ user: createdUser._id }).catch(() => {});
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      const response = await buildAuthResponse(user, { req, res });
      req.user = user;
      await AuditService.record({
        req,
        action: AUDIT_ACTIONS.AUTH_LOGIN,
        entity: 'user',
        entityId: user._id,
        after: { email: user.email, role: user.role },
      });
      res.json(response);
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

export const refreshSession = async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!raw) {
      res.status(401);
      throw new Error('No refresh session');
    }
    const { user, accessToken, refreshToken } = await rotateRefreshToken(raw, { req });
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    const response = await buildAuthResponse(user, { req, res: null, skipRefresh: true });
    res.json({ ...response, token: accessToken, accessToken });
  } catch (error) {
    res.status(error.status || 401);
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    await revokeRefreshToken(raw);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    if (req.user) {
      await AuditService.record({
        req,
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        entity: 'user',
        entityId: req.user._id,
      });
    }
    res.json({ message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

export const logoutAllSessions = async (req, res, next) => {
  try {
    await revokeAllUserSessions(req.user._id);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    await AuditService.record({
      req,
      action: AUDIT_ACTIONS.AUTH_SESSION_REVOKE_ALL,
      entity: 'user',
      entityId: req.user._id,
    });
    res.json({ message: 'All sessions revoked' });
  } catch (error) {
    next(error);
  }
};

export const listRegistrationHospitals = async (req, res, next) => {
  try {
    const tenants = await TenantService.listTenantsWithBranches();
    res.json(
      tenants.map((t) => ({
        slug: t.slug,
        name: t.name,
        branches: (t.branches || []).map((b) => ({
          slug: b.slug,
          name: b.name,
          city: b.city,
          state: b.state,
        })),
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
      if (!profile) {
        res.status(404);
        throw new Error('Patient profile missing. Please re-register or contact admin.');
      }
      if (!profile.patientId) {
        profile.patientId = await generatePatientId();
        await profile.save();
      }
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    }

    const staff = await Staff.findOne({ user: user._id, isActive: true })
      .populate('tenant', 'slug name')
      .populate('branch', 'slug name city');
    const operationalRole = resolveOperationalRole(user, staff);

    res.json({
      user,
      profile,
      staff,
      operationalRole,
      patientId: profile?.patientId ?? null,
      doctorId: profile?.doctorId ?? null,
    });
  } catch (error) {
    next(error);
  }
};
