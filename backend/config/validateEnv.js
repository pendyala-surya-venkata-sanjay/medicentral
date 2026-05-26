/**
 * Startup environment validation (Phase 7).
 */

const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];
const PRODUCTION_REQUIRED = ['JWT_REFRESH_SECRET'];

export const validateEnv = () => {
  const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.warn('[env] JWT_SECRET should be at least 32 characters in production');
  }

  if (process.env.NODE_ENV === 'production') {
    const prodMissing = PRODUCTION_REQUIRED.filter((k) => !process.env[k]?.trim());
    if (prodMissing.length) {
      throw new Error(`Production requires: ${prodMissing.join(', ')}`);
    }
    if (!process.env.CORS_ORIGIN?.trim()) {
      throw new Error('Production requires CORS_ORIGIN');
    }
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,
    strictTenantScope: process.env.STRICT_TENANT_SCOPE === 'true',
    accessTokenTtl: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 7,
  };
};

export default validateEnv;
