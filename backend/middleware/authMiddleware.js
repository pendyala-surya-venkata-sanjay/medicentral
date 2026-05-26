import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyAccessToken } from '../modules/auth/token.service.js';

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

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`User role ${req.user ? req.user.role : 'unknown'} is not authorized`)
      );
    }
    return next();
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
