import Patient from '../../models/Patient.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import Prescription from '../../models/Prescription.js';
import LabReport from '../../models/LabReport.js';
import { GlobalTimelineService } from '../interoperability/global-timeline.service.js';
import { evaluateVitals } from './vitals-rules.js';
import { INTELLIGENCE_DISCLAIMER } from '../../../shared/constants/intelligence.js';

const monthsAgo = (d, m) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() - m);
  return x;
};

export class PatientSummaryService {
  static async buildSummary(patient, { access = null, visit = null } = {}) {
    const pid = patient._id || patient;
    const profile = patient.patientId ? patient : await Patient.findById(pid).populate('user', 'name');

    const [visits, prescriptions, labReports, timeline] = await Promise.all([
      HospitalVisit.find({ patient: profile._id })
        .populate('tenant', 'name slug')
        .populate('branch', 'name city')
        .sort({ checkIn: -1 })
        .limit(20)
        .lean(),
      Prescription.find({ patient: profile._id }).sort({ createdAt: -1 }).limit(10).lean(),
      LabReport.find({ patient: profile._id }).sort({ createdAt: -1 }).limit(15).lean(),
      GlobalTimelineService.buildForPatient(profile, { access }),
    ]);

    const activeVisit = visit || visits[0];
    const vitalsFlags = evaluateVitals(activeVisit?.vitals || visits[0]?.vitals);
    const allergies = profile.allergies || [];
    const medications = profile.ongoingMedications || [];

    const surgeries = visits.filter(
      (v) =>
        v.surgery?.procedureName ||
        ['SURGERY_REQUIRED', 'IN_SURGERY', 'POST_SURGERY', 'SURGERY_SCHEDULED'].includes(v.workflowState)
    );

    const recentSurgery = surgeries.find((s) => s.surgery?.procedureName || s.checkIn);
    const admissions = visits.filter((v) => v.visitType === 'IP' || v.inpatient?.admittedAt);
    const abnormalLabs = labReports.filter((l) =>
      /abnormal|high|low|critical|positive/i.test(l.result || l.notes || '')
    );

    const chronicHints = [];
    prescriptions.forEach((rx) => {
      const d = (rx.diagnosis || '').toLowerCase();
      if (/diabet|hypertens|cardiac|asthma|copd|ckd/i.test(d)) chronicHints.push(rx.diagnosis);
    });
    const uniqueChronic = [...new Set(chronicHints)].slice(0, 4);

    const criticalEvents = (timeline.events || [])
      .filter((e) =>
        ['surgery', 'admission', 'consent', 'lab'].includes(e.type) ||
        /emergency|critical|surgery|admit/i.test(e.title || '')
      )
      .slice(0, 6);

    const hospitals = [...new Set(visits.map((v) => v.tenant?.name).filter(Boolean))];

    const narrativeParts = [];
    if (allergies.length) narrativeParts.push(`Known allergies: ${allergies.join(', ')}.`);
    if (medications.length) narrativeParts.push(`Active medications include ${medications.slice(0, 5).join(', ')}.`);
    if (uniqueChronic.length) narrativeParts.push(`Chronic context: ${uniqueChronic.join('; ')}.`);
    if (recentSurgery) {
      const t = recentSurgery.tenant?.name || 'Hospital';
      const loc = recentSurgery.branch?.city || recentSurgery.branch?.name || '';
      const proc = recentSurgery.surgery?.procedureName || 'surgery';
      const when = recentSurgery.checkIn ? new Date(recentSurgery.checkIn).toLocaleDateString() : 'recently';
      narrativeParts.push(`${proc} at ${t} ${loc} (${when}).`.replace(/\s+/g, ' '));
    } else if (surgeries.length) {
      narrativeParts.push(`${surgeries.length} surgery-related visit(s) on record.`);
    }
    if (admissions.length) narrativeParts.push(`${admissions.length} inpatient admission(s) in history.`);
    if (abnormalLabs.length) narrativeParts.push(`${abnormalLabs.length} lab report(s) with flagged results.`);
    if (vitalsFlags.length) narrativeParts.push(`Latest vitals: ${vitalsFlags.map((f) => f.message).join('; ')}.`);
    if (hospitals.length > 1) narrativeParts.push(`Care received across: ${hospitals.join(', ')}.`);

    const narrative =
      narrativeParts.length > 0
        ? narrativeParts.join(' ')
        : 'Limited structured history — review full timeline for clinical context.';

    const riskIndicators = [
      ...vitalsFlags.map((f) => ({ type: 'vitals', severity: f.severity, message: f.message })),
      ...(allergies.length
        ? [{ type: 'allergy', severity: 'warning', message: `${allergies.length} allergy alert(s) on file` }]
        : []),
      ...(abnormalLabs.length
        ? [{ type: 'lab', severity: 'warning', message: `${abnormalLabs.length} abnormal lab result(s)` }]
        : []),
      ...(admissions.filter((v) => v.checkIn && new Date(v.checkIn) > monthsAgo(new Date(), 3)).length > 1
        ? [{ type: 'readmission', severity: 'info', message: 'Multiple recent admissions' }]
        : []),
    ];

    return {
      disclaimer: INTELLIGENCE_DISCLAIMER,
      source: 'deterministic',
      llmReady: true,
      patientId: profile.patientId,
      narrative,
      cards: {
        allergies,
        medications,
        chronicConditions: uniqueChronic,
        recentSurgeries: surgeries.slice(0, 3).map((v) => ({
          procedure: v.surgery?.procedureName,
          hospital: v.tenant?.name,
          date: v.checkIn,
        })),
        abnormalVitals: vitalsFlags,
        recentAdmissions: admissions.slice(0, 3).map((v) => ({
          ward: v.inpatient?.wardName,
          hospital: v.tenant?.name,
          date: v.inpatient?.admittedAt || v.checkIn,
        })),
        criticalEvents: criticalEvents.map((e) => ({
          title: e.displayTitle || e.title,
          date: e.date,
          hospital: e.hospital,
        })),
      },
      stats: {
        totalVisits: visits.length,
        hospitals: hospitals.length,
        prescriptions: prescriptions.length,
        labReports: labReports.length,
      },
      compressedTimelinePreview: criticalEvents.slice(0, 4),
    };
  }
}

export default PatientSummaryService;
