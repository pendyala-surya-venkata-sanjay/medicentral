import Prescription from '../../models/Prescription.js';
import { TimelineService } from '../timeline/timeline.service.js';
import { VisitBillingService } from '../billing/visit-billing.service.js';

const provenanceTitle = (tenant, branch, title) => {
  const t = tenant?.name || tenant?.slug || 'Hospital';
  const b = branch?.name || branch?.city || '';
  return `${t}${b ? ` ${b}` : ''} — ${title}`;
};

export class PharmacyOpsService {
  static async getVisitPharmacyContext(visit, patient) {
    const prescriptions = await Prescription.find({ patient: patient._id || patient })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const pending = (visit.pharmacyFulfillment || []).filter((p) => p.status !== 'dispensed');
    const dispensed = (visit.pharmacyFulfillment || []).filter((p) => p.status === 'dispensed');

    return {
      prescriptions,
      fulfillment: visit.pharmacyFulfillment || [],
      pending,
      dispensed,
    };
  }

  static async loadFromPrescriptions({ visit, patient }) {
    const prescriptions = await Prescription.find({ patient: patient._id || patient })
      .sort({ createdAt: -1 })
      .limit(1);

    const rx = prescriptions[0];
    if (!rx?.medicines?.length) return [];

    const items = rx.medicines.map((m) => ({
      medicationName: m.medicine || 'Medication',
      dosage: m.dosage || m.frequency,
      quantity: m.quantity || 1,
      status: 'pending',
      amount: 50,
    }));

    visit.pharmacyFulfillment = [...(visit.pharmacyFulfillment || []), ...items];
    await visit.save();
    return items;
  }

  static async dispenseAll({ visit, patient, tenant, branch, staff }) {
    if (!visit.pharmacyFulfillment?.length) {
      await this.loadFromPrescriptions({ visit, patient });
    }

    const now = new Date();
    (visit.pharmacyFulfillment || []).forEach((item) => {
      if (item.status !== 'dispensed') {
        item.status = 'dispensed';
        item.dispensedAt = now;
      }
    });
    await visit.save();

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant,
      branch,
      type: 'prescription',
      title: provenanceTitle(tenant, branch, 'Pharmacy dispensed medicines'),
      summary: `${visit.pharmacyFulfillment.length} item(s) fulfilled`,
      payload: { pharmacy: true },
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    await VisitBillingService.refreshVisitBill({ visit, patient });

    return visit.pharmacyFulfillment;
  }

  static async addPharmacyItems({ visit, items }) {
    visit.pharmacyFulfillment = visit.pharmacyFulfillment || [];
    items.forEach((item) => {
      visit.pharmacyFulfillment.push({
        medicationName: item.medicationName,
        dosage: item.dosage,
        quantity: item.quantity || 1,
        status: 'pending',
        amount: item.amount || 50,
      });
    });
    await visit.save();
    return visit.pharmacyFulfillment;
  }
}

export default PharmacyOpsService;
