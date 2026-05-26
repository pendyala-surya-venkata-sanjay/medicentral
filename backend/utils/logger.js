/**
 * Structured application logging (Phase 7).
 */

const levelRank = { debug: 10, info: 20, warn: 30, error: 40 };

const minLevel = levelRank[process.env.LOG_LEVEL] ?? levelRank.info;

const write = (level, message, meta = {}) => {
  if (levelRank[level] < minLevel) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    service: 'medicentral-api',
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

export const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
  workflow: (action, meta) => write('info', `workflow:${action}`, { category: 'workflow', ...meta }),
  realtime: (event, meta) => write('debug', `socket:${event}`, { category: 'realtime', ...meta }),
  audit: (action, meta) => write('info', `audit:${action}`, { category: 'audit', ...meta }),
};

export default logger;
