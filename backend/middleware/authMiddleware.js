import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/platform/Staff.js';
import { verifyAccessToken } from '../modules/auth/token.service.js';
import { resolveOperationalRole } from '../modules/auth/rbac.js';

export const protect = async (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        return next(new Error('Not authorized, user not found'));
      }

      if ((decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) {
        res.status(401);
        return next(new Error('Session expired — please sign in again'));
      }

      req.user = user;
      req.tokenPayload = decoded;
      return next();
    } catch (err) {
      res.status(401);
      return next(new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Not authorized, token failed'));
    }
  }

  res.status(401);
  return next(new Error('Not authorized, no token'));
};

/**
 * Allow legacy User.role and matching Staff operationalRole (e.g. staff + doctor).
 */
export const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      res.status(403);
      return next(new Error('User role unknown is not authorized'));
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    try {
      let staff = req.staff;
      if (!staff) {
        staff = await Staff.findOne({ user: req.user._id, isActive: true });
      }
      const opRole = resolveOperationalRole(req.user, staff);
      if (roles.includes(opRole)) {
        req.staff = staff;
        req.operationalRole = opRole;
        return next();
      }
    } catch (err) {
      return next(err);
    }

    res.status(403);
    return next(
      new Error(`User role ${req.user.role} is not authorized`)
    );
  };
};

/** Optional auth — attaches user when token present */
export const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) return next();
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (user && (decoded.tv ?? 0) === (user.tokenVersion ?? 0)) {
      req.user = user;
    }
  } catch {
    /* ignore */
  }
  next();
};

export default { protect, authorize, optionalProtect };
