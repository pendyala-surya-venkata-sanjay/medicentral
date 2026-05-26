import HospitalTenant from '../../models/platform/HospitalTenant.js';
import Branch from '../../models/platform/Branch.js';
import { haversineKm } from '../../utils/geo.js';

export const REGISTERED_TENANTS = [
  {
    slug: 'apollo',
    name: 'Apollo Healthcare',
    branches: [
      {
        slug: 'hyderabad',
        name: 'Apollo Hospitals Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Road No. 72, Jubilee Hills, Hyderabad',
        phone: '+914044777777',
        bookingPhone: '+914044777700',
        lat: 17.4126,
        lng: 78.4071,
      },
      {
        slug: 'chennai',
        name: 'Apollo Hospitals Greams Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: '21 Greams Lane, Off Greams Road, Chennai',
        phone: '+914428282828',
        bookingPhone: '+914428282800',
        lat: 13.0569,
        lng: 80.2425,
      },
    ],
  },
  {
    slug: 'yashoda',
    name: 'Yashoda Hospitals',
    branches: [
      {
        slug: 'bangalore',
        name: 'Yashoda Hospitals Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        address: 'Sri Sai Nagar, Bommanahalli, Bengaluru',
        phone: '+918040404040',
        bookingPhone: '+918040404400',
        lat: 12.9141,
        lng: 77.6101,
      },
      {
        slug: 'vijayawada',
        name: 'Yashoda Hospitals Vijayawada',
        city: 'Vijayawada',
        state: 'Andhra Pradesh',
        address: 'NH 16 Service Road, Benz Circle, Vijayawada',
        phone: '+918662456789',
        bookingPhone: '+918662456700',
        lat: 16.5062,
        lng: 80.648,
      },
    ],
  },
];

/** @deprecated use REGISTERED_TENANTS */
export const DEMO_TENANTS = REGISTERED_TENANTS;

export class TenantService {
  static async ensureDemoTenants() {
    const results = [];
    for (const t of REGISTERED_TENANTS) {
      let tenant = await HospitalTenant.findOne({ slug: t.slug });
      if (!tenant) {
        tenant = await HospitalTenant.create({
          slug: t.slug,
          name: t.name,
          orgCode: t.slug,
        });
        results.push({ tenant: tenant.slug, created: true });
      } else {
        if (!tenant.orgCode) {
          tenant.orgCode = t.slug;
          await tenant.save();
        }
        results.push({ tenant: tenant.slug, created: false });
      }

      for (const b of t.branches) {
        const exists = await Branch.findOne({ tenant: tenant._id, slug: b.slug });
        if (!exists) {
          await Branch.create({ tenant: tenant._id, ...b });
          results.push({ branch: `${t.slug}/${b.slug}`, created: true });
        } else {
          await Branch.updateOne({ _id: exists._id }, { $set: b });
        }
      }
    }
    return results;
  }

  static async listRegisteredHospitals({ lat, lng } = {}) {
    const tenants = await HospitalTenant.find({ isActive: true }).lean();
    const branches = await Branch.find({ isActive: true }).lean();
    const userLat = Number(lat);
    const userLng = Number(lng);
    const hasUser = !Number.isNaN(userLat) && !Number.isNaN(userLng);

    const rows = [];
    for (const branch of branches) {
      const tenant = tenants.find((t) => t._id.toString() === branch.tenant.toString());
      if (!tenant || branch.lat == null || branch.lng == null) continue;
      const distanceKm = hasUser
        ? Number(haversineKm(userLat, userLng, branch.lat, branch.lng).toFixed(1))
        : null;
      rows.push({
        _id: `${tenant.slug}-${branch.slug}`,
        tenantId: tenant._id,
        branchId: branch._id,
        tenantSlug: tenant.slug,
        branchSlug: branch.slug,
        name: `${tenant.name} — ${branch.name}`,
        hospitalName: tenant.name,
        branchName: branch.name,
        address: branch.address || `${branch.name}, ${branch.city}`,
        city: branch.city,
        state: branch.state,
        contactNumber: branch.bookingPhone || branch.phone || '—',
        emergencyNumber: branch.phone || branch.bookingPhone || '—',
        facilities: ['Registered partner', 'Appointment booking', 'OPD'],
        location: { lat: branch.lat, lng: branch.lng },
        distanceKm,
        distanceText:
          distanceKm != null
            ? distanceKm < 1
              ? `${Math.round(distanceKm * 1000)} m`
              : `${distanceKm} km`
            : null,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`,
        directionsUrl: hasUser
          ? `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${branch.lat},${branch.lng}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`,
        source: 'medicentral-registered',
      });
    }

    if (hasUser) {
      rows.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
    return rows;
  }

  static async getTenantBySlug(slug) {
    return HospitalTenant.findOne({ slug: slug.toLowerCase(), isActive: true });
  }

  static async getBranch(tenantSlug, branchSlug) {
    const tenant = await this.getTenantBySlug(tenantSlug);
    if (!tenant) return null;
    return Branch.findOne({ tenant: tenant._id, slug: branchSlug.toLowerCase() });
  }

  static async listTenantsWithBranches() {
    const tenants = await HospitalTenant.find({ isActive: true }).lean();
    const branches = await Branch.find({ isActive: true }).lean();
    return tenants.map((t) => ({
      ...t,
      branches: branches.filter((b) => b.tenant.toString() === t._id.toString()),
    }));
  }

  static async getDefaultBranch() {
    const tenant = await HospitalTenant.findOne({ slug: 'apollo' });
    if (!tenant) return { tenant: null, branch: null };
    const branch = await Branch.findOne({ tenant: tenant._id, slug: 'hyderabad' });
    return { tenant, branch };
  }

  static async resolveTenantBranch(tenantSlug, branchSlug = null) {
    const tenant = await this.getTenantBySlug(tenantSlug);
    if (!tenant) return { tenant: null, branch: null };
    if (branchSlug) {
      const branch = await this.getBranch(tenantSlug, branchSlug);
      return { tenant, branch };
    }
    const branch = await Branch.findOne({ tenant: tenant._id, isActive: true });
    return { tenant, branch };
  }
}

export default TenantService;
