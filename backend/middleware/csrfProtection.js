/**
 * CSRF protection for cookie-based refresh endpoints.
 * Validates Origin/Referer against configured CORS origins.
 */

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return raw.split(',').map((o) => o.trim().replace(/\/$/, ''));
};

export const csrfProtection = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '');
  if (!origin) {
    if (process.env.NODE_ENV === 'production') {
      res.status(403);
      return next(new Error('CSRF: missing origin'));
    }
    return next();
  }

  const normalized = origin.replace(/\/$/, '');
  const allowed = getAllowedOrigins();
  if (!allowed.some((a) => normalized === a || normalized.startsWith(a))) {
    res.status(403);
    return next(new Error('CSRF: origin not allowed'));
  }
  next();
};

export default csrfProtection;
