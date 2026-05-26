import Patient from '../../models/Patient.js';
import User from '../../models/User.js';
import Prescription from '../../models/Prescription.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import LabReport from '../../models/LabReport.js';
import Doctor from '../../models/Doctor.js';
import HospitalTenant from '../../models/platform/HospitalTenant.js';

const fuzzy = (text, q) => {
  if (!text || !q) return false;
  return String(text).toLowerCase().includes(q.toLowerCase());
};

export class SmartSearchService {
  static async search({ query, tenantId = null, limit = 25 }) {
    const q = (query || '').trim();
    if (q.length < 2) return { query: q, results: [] };

    const results = [];
    const visitFilter = tenantId ? { tenant: tenantId } : {};

    const patients = await Patient.find({
      $or: [
        { patientId: new RegExp(q, 'i') },
        { contactNumber: new RegExp(q, 'i') },
        { aadhaarLast4: q.length === 4 ? q : undefined },
      ].filter((c) => Object.values(c).every((v) => v !== undefined)),
    })
      .populate('user', 'name email')
      .limit(15)
      .lean();

    const usersByName = await User.find({ name: new RegExp(q, 'i') }).select('_id').limit(10);
    if (usersByName.length) {
      const more = await Patient.find({ user: { $in: usersByName.map((u) => u._id) } })
        .populate('user', 'name')
        .lean();
      more.forEach((p) => {
        if (!patients.find((x) => x._id.toString() === p._id.toString())) patients.push(p);
      });
    }

    patients.forEach((p) => {
      results.push({
        kind: 'patient',
        id: p.patientId,
        title: p.user?.name || p.patientId,
        subtitle: p.patientId,
        relevance: 1,
      });
    });

    const rxList = await Prescription.find({
      $or: [{ diagnosis: new RegExp(q, 'i') }, { 'medicines.medicine': new RegExp(q, 'i') }],
    })
      .populate('patient')
      .limit(10)
      .lean();

    rxList.forEach((rx) => {
      if (tenantId) return;
      results.push({
        kind: 'prescription',
        id: rx._id,
        title: rx.diagnosis,
        subtitle: `${rx.medicines?.length || 0} medicines`,
        relevance: 0.8,
      });
    });

    const visits = await HospitalVisit.find({
      ...visitFilter,
      $or: [
        { department: new RegExp(q, 'i') },
        { workflowState: new RegExp(q, 'i') },
        { diagnosisSummary: new RegExp(q, 'i') },
        { tokenNumber: new RegExp(q, 'i') },
      ],
    })
      .populate('patient')
      .limit(10)
      .lean();

    visits.forEach((v) => {
      results.push({
        kind: 'visit',
        id: v._id,
        title: `${v.workflowState} — ${v.department}`,
        subtitle: v.patient?.patientId || v.tokenNumber,
        relevance: 0.85,
      });
    });

    const labs = await LabReport.find({
      ...(tenantId ? { tenant: tenantId } : {}),
      $or: [{ testName: new RegExp(q, 'i') }, { result: new RegExp(q, 'i') }],
    })
      .limit(10)
      .lean();

    labs.forEach((l) => {
      results.push({
        kind: 'lab',
        id: l._id,
        title: l.testName,
        subtitle: l.result?.slice(0, 60),
        relevance: 0.75,
      });
    });

    const tenants = await HospitalTenant.find({ name: new RegExp(q, 'i') }).limit(5).lean();
    tenants.forEach((t) => {
      results.push({ kind: 'hospital', id: t.slug, title: t.name, subtitle: 'Hospital network', relevance: 0.6 });
    });

    const doctors = await Doctor.find().populate('user', 'name').limit(50).lean();
    doctors
      .filter((d) => fuzzy(d.user?.name, q))
      .slice(0, 5)
      .forEach((d) => {
        results.push({
          kind: 'doctor',
          id: d._id,
          title: d.user?.name,
          subtitle: d.specialization,
          relevance: 0.7,
        });
      });

    results.sort((a, b) => b.relevance - a.relevance);
    return { query: q, results: results.slice(0, limit) };
  }
}

export default SmartSearchService;
