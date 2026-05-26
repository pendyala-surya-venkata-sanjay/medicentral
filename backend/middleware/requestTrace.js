import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export const requestTrace = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const start = Date.now();

  res.on('finish', () => {
    if (req.path === '/health' || req.path === '/api/health') return;
    logger.info('http_request', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      userId: req.user?._id,
    });
  });

  next();
};

export default requestTrace;
