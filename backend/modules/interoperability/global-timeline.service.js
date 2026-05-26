import MedicalRecord from '../../models/MedicalRecord.js';
import Prescription from '../../models/Prescription.js';
import VoiceNote from '../../models/VoiceNote.js';
import SurgeryMedia from '../../models/SurgeryMedia.js';
import Billing from '../../models/Billing.js';
import Prediction from '../../models/Prediction.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import Admission from '../../models/Admission.js';
import Discharge from '../../models/Discharge.js';
import LabReport from '../../models/LabReport.js';
import PatientDocument from '../../models/PatientDocument.js';
import TimelineEvent from '../../models/platform/TimelineEvent.js';
import HospitalTenant from '../../models/platform/HospitalTenant.js';
import Branch from '../../models/platform/Branch.js';
import { PatientAccessService } from './patient-access.service.js';

const enrichProvenance = (event, tenant, branch) => {
  const hospital = tenant?.name || event.data?.tenant?.name;
  const branchName = branch?.name || branch?.city || event.data?.branch?.name;
  const prefix = hospital ? `${hospital}${branchName ? ` ${branchName}` : ''}` : '';
  return {
    ...event,
    hospital,
    branch: branchName,
    provenanceLabel: prefix ? `${prefix}` : undefined,
    displayTitle: prefix ? `${prefix} → ${event.title.replace(/^[^→]+→\s*/, '')}` : event.title,
  };
};

export class GlobalTimelineService {
  static async buildForPatient(patient, { access = null, limit = 80, skip = 0 } = {}) {
    const pid = patient._id;
    const [
      records,
      prescriptions,
      voiceNotes,
      surgeryMedia,
      bills,
      predictions,
      visits,
      admissions,
      discharges,
      labReports,
      patientDocuments,
      structured,
    ] = await Promise.all([
      MedicalRecord.find({ patient: pid })
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort({ dateOfVisit: -1 }),
      Prescription.find({ patient: pid }).sort({ createdAt: -1 }),
      VoiceNote.find({ patient: pid }).sort({ createdAt: -1 }),
      SurgeryMedia.find({ patient: pid }).sort({ visitDate: -1 }),
      Billing.find({ patient: pid }).sort({ createdAt: -1 }),
      Prediction.find({ user: patient.user?._id || patient.user }).sort({ createdAt: -1 }),
      HospitalVisit.find({ patient: pid }).populate('tenant', 'slug name').populate('branch', 'slug name city').sort({ checkIn: -1 }),
      Admission.find({ patient: pid }).sort({ admittedAt: -1 }),
      Discharge.find({ patient: pid }).sort({ dischargedAt: -1 }),
      LabReport.find({ patient: pid }).populate('tenant', 'name').populate('branch', 'name city').sort({ createdAt: -1 }),
      PatientDocument.find({ patient: pid }).sort({ createdAt: -1 }),
      TimelineEvent.find({ patient: pid })
        .populate('tenant', 'slug name')
        .populate('branch', 'slug name city')
        .sort({ occurredAt: -1 })
        .limit(300)
        .lean(),
    ]);

    const events = [];

    const push = (e) => events.push(e);

    records.forEach((r) =>
      push({
        type: 'record',
        id: r._id,
        date: r.dateOfVisit || r.createdAt,
        title: r.diagnosis,
        summary: r.doctorNotes,
        data: r,
      })
    );
    prescriptions.forEach((p) =>
      push({
        type: 'prescription',
        id: p._id,
        date: p.date || p.createdAt,
        title: `Prescription — ${p.diagnosis}`,
        summary: `${p.medicines?.length || 0} medicines`,
        visitId: p.visit?.toString?.() || (p.visit ? String(p.visit) : undefined),
        data: p,
      })
    );
    voiceNotes.forEach((v) =>
      push({ type: 'voice', id: v._id, date: v.createdAt, title: v.title, summary: v.description, data: v })
    );
    surgeryMedia.forEach((s) =>
      push({ type: 'surgery', id: s._id, date: s.visitDate || s.createdAt, title: s.title, summary: s.caption, data: s })
    );
    bills.forEach((b) =>
      push({
        type: 'billing',
        id: b._id,
        date: b.createdAt,
        title: `Bill — ₹${b.totalAmount}`,
        summary: `Status: ${b.status}`,
        visitId: b.visit?.toString?.() || (b.visit ? String(b.visit) : undefined),
        data: b,
      })
    );
    predictions.forEach((p) =>
      push({
        type: 'prediction',
        id: p._id,
        date: p.createdAt,
        title: `Symptom analysis — ${p.predictedDisease}`,
        summary: `Confidence: ${p.confidenceScore}`,
        data: p,
      })
    );
    labReports.forEach((l) =>
      push({
        type: 'lab',
        id: l._id,
        date: l.completedAt || l.createdAt,
        title: `Lab — ${l.testName}`,
        summary: l.result || l.status,
        visitId: l.visit?.toString?.() || (l.visit ? String(l.visit) : undefined),
        data: { ...l.toObject?.() || l, tenant: l.tenant, branch: l.branch },
        tenant: l.tenant,
        branch: l.branch,
      })
    );
    patientDocuments.forEach((d) =>
      push({
        type: 'patient_upload',
        id: d._id,
        date: d.createdAt,
        title: d.title,
        summary: d.category,
        data: d,
      })
    );
    visits.forEach((v) =>
      push({
        type: 'visit',
        id: v._id,
        visitId: v._id.toString(),
        date: v.checkIn,
        title: `${v.visitType || 'OP'} — ${v.department}`,
        summary: v.workflowState || v.status,
        data: v,
        tenant: v.tenant,
        branch: v.branch,
      })
    );
    admissions.forEach((a) =>
      push({ type: 'admission', id: a._id, date: a.admittedAt, title: `Admitted — ${a.ward}`, summary: a.roomNumber, data: a })
    );
    discharges.forEach((d) =>
      push({ type: 'discharge', id: d._id, date: d.dischargedAt, title: 'Discharged', summary: d.summary, data: d })
    );

    structured.forEach((e) => {
      const exists = events.some((ev) => ev.id?.toString() === e.sourceRef?.toString());
      if (!exists) {
        push({
          type: e.type,
          id: e._id,
          date: e.occurredAt,
          title: e.title,
          summary: e.summary,
          visitId: e.visit?.toString?.() || (e.visit ? String(e.visit) : undefined),
          data: { ...e.payload, tenant: e.tenant, branch: e.branch, structured: true },
          tenant: e.tenant,
          branch: e.branch,
        });
      }
    });

    let filtered = events;
    if (access?.accessibleTenantIds) {
      filtered = PatientAccessService.filterEventsByScope(
        events,
        access.scopeLevel,
        access.accessibleTenantIds
      );
    } else if (access?.scopeLevel && access.reason === 'consent') {
      filtered = PatientAccessService.filterEventsByScope(events, access.scopeLevel, null);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = filtered.length;
    const page = filtered.slice(skip, skip + limit);

    const enriched = page.map((e) =>
      enrichProvenance(
        e,
        e.tenant || e.data?.tenant,
        e.branch || e.data?.branch
      )
    );

    const { hospitals } = await PatientAccessService.getPatientTenantHistory(pid);

    return {
      patientId: patient.patientId,
      events: enriched,
      total,
      limit,
      skip,
      hasMore: skip + limit < total,
      hospitals,
      access: access
        ? { reason: access.reason, scopeLevel: access.scopeLevel }
        : { reason: 'full', scopeLevel: 'full_access' },
    };
  }
}

export default GlobalTimelineService;
