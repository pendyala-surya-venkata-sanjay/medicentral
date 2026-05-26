/** Trust proxy for correct IP behind NGINX */
export const trustProxy = (app) => {
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }
};

const stripHtml = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
};

export const sanitizeInput = (req, res, next) => {
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') obj[key] = stripHtml(obj[key]);
      else if (typeof obj[key] === 'object') walk(obj[key]);
    }
  };
  if (req.body) walk(req.body);
  next();
};

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

export default { trustProxy, sanitizeInput, securityHeaders };
