import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '../../models/RefreshToken.js';
import User from '../../models/User.js';

const accessSecret = () => process.env.JWT_SECRET;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

export const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, tv: user.tokenVersion ?? 0 },
    accessSecret(),
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

export const verifyAccessToken = (token) => jwt.verify(token, accessSecret());

export const createRefreshToken = async (user, { req } = {}) => {
  const raw = crypto.randomBytes(48).toString('hex');
  const days = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: user._id,
    tokenHash: RefreshToken.hashToken(raw),
    expiresAt,
    userAgent: req?.headers?.['user-agent']?.slice(0, 256),
    ip: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim(),
  });

  return raw;
};

export const rotateRefreshToken = async (rawToken, { req } = {}) => {
  const hash = RefreshToken.hashToken(rawToken);
  const existing = await RefreshToken.findOne({
    tokenHash: hash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!existing) {
    const err = new Error('Invalid refresh session');
    err.status = 401;
    throw err;
  }

  const user = await User.findById(existing.user);
  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }

  const newRaw = crypto.randomBytes(48).toString('hex');
  const days = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  existing.revokedAt = new Date();
  existing.replacedBy = RefreshToken.hashToken(newRaw);
  await existing.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: RefreshToken.hashToken(newRaw),
    expiresAt,
    userAgent: req?.headers?.['user-agent']?.slice(0, 256),
    ip: req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim(),
  });

  return { user, refreshToken: newRaw, accessToken: generateAccessToken(user) };
};

export const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) return;
  const hash = RefreshToken.hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash: hash, revokedAt: null }, { revokedAt: new Date() });
};

export const revokeAllUserSessions = async (userId) => {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
};

export const REFRESH_COOKIE = 'mc_refresh';

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: (Number(process.env.REFRESH_TOKEN_DAYS) || 7) * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});

export default {
  generateAccessToken,
  verifyAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  REFRESH_COOKIE,
  refreshCookieOptions,
};
