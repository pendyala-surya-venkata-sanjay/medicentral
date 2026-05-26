/**
 * Seed Apollo + Yashoda tenants/branches and optional Staff profiles for demo users.
 * Run: node scripts/seedFoundation.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import User from '../models/User.js';
import Staff from '../models/platform/Staff.js';
import HospitalTenant from '../models/platform/HospitalTenant.js';
import Branch from '../models/platform/Branch.js';

dotenv.config();

const DEMO_STAFF = [
  { email: 'staff@demo.com', role: 'receptionist', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'pa@demo.com', role: 'doctor_pa', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'doctor@demo.com', role: 'doctor', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'lab@demo.com', role: 'lab_supervisor', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'billing@demo.com', role: 'billing_staff', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'ward@demo.com', role: 'ward_manager', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'surgery@demo.com', role: 'surgery_head', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'pharmacy@demo.com', role: 'pharmacist', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'discharge@demo.com', role: 'printer_filing_officer', tenant: 'apollo', branch: 'hyderabad' },
  { email: 'superadmin@demo.com', role: 'super_admin', tenant: 'apollo', branch: 'hyderabad' },
];

const ensureDemoUser = async ({ email, name, role = 'staff' }) => {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password: 'demo123', role });
    console.log(`Created ${email} (password: demo123, role: ${role})`);
  } else if (role === 'admin' && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  return user;
};

const seed = async () => {
  await connectDB();

  const tenantResults = await TenantService.ensureDemoTenants();
  console.log('Tenants:', tenantResults);

  await ensureDemoUser({ email: 'pa@demo.com', name: 'Anita PA' });
  await ensureDemoUser({ email: 'lab@demo.com', name: 'Lab Supervisor' });
  await ensureDemoUser({ email: 'billing@demo.com', name: 'Billing Clerk' });
  await ensureDemoUser({ email: 'ward@demo.com', name: 'Ward Manager' });
  await ensureDemoUser({ email: 'surgery@demo.com', name: 'Surgery Head' });
  await ensureDemoUser({ email: 'pharmacy@demo.com', name: 'Pharmacist' });
  await ensureDemoUser({ email: 'discharge@demo.com', name: 'Discharge Officer' });
  await ensureDemoUser({ email: 'superadmin@demo.com', name: 'Platform Super Admin', role: 'admin' });

  for (const s of DEMO_STAFF) {
    const user = await User.findOne({ email: s.email });
    if (!user) {
      console.log(`Skip staff (no user): ${s.email}`);
      continue;
    }
    const tenant = await HospitalTenant.findOne({ slug: s.tenant });
    const branch = await Branch.findOne({ tenant: tenant._id, slug: s.branch });
    const existing = await Staff.findOne({ user: user._id });
    if (existing) {
      existing.operationalRole = s.role;
      existing.tenant = tenant._id;
      existing.branch = branch._id;
      await existing.save();
      console.log(`Updated Staff: ${s.email} → ${s.role} @ ${s.tenant}/${s.branch}`);
    } else {
      await Staff.create({
        user: user._id,
        operationalRole: s.role,
        tenant: tenant._id,
        branch: branch._id,
      });
      console.log(`Created Staff: ${s.email} → ${s.role} @ ${s.tenant}/${s.branch}`);
    }
  }

  console.log('Foundation seed complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
