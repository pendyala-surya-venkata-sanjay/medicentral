import { TenantService } from '../modules/tenants/tenant.service.js';

export const ensureFoundationSeeded = async () => {
  if (process.env.SEED_FOUNDATION !== 'true') {
    return { seeded: false };
  }
  const results = await TenantService.ensureDemoTenants();
  return { seeded: true, results };
};
