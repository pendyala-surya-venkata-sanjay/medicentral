import Prescription from '../../models/Prescription.js';
import LabReport from '../../models/LabReport.js';
import { PatientSummaryService } from './patient-summary.service.js';
import { evaluateVitals } from './vitals-rules.js';
import { ALERT_SEVERITY, ALERT_TYPES } from '../../../shared/constants/intelligence.js';

const ALLERGY_CONFLICTS = [
  { allergen: /penicillin|amoxicillin/i, drug: /penicillin|amoxicillin|ampicillin/i },
  { allergen: /sulfa|sulfonamide/i, drug: /sulfa|sulfamethoxazole/i },
  { allergen: /aspirin/i, drug: /aspirin|ibuprofen/i },
];

export class ClinicalAssistantService {
  static checkMedicationConflicts(allergies, medicines = []) {
    const alerts = [];
    const allergyText = (allergies || []).join(' ').toLowerCase();
    medicines.forEach((med) => {
      const name = (med.medicine || med.medicationName || med || '').toString();
      ALLERGY_CONFLICTS.forEach(({ allergen, drug }) => {
        if (allergen.test(allergyText) && drug.test(name)) {
          alerts.push({
            type: ALERT_TYPES.MEDICATION,
            severity: ALERT_SEVERITY.CRITICAL,
            message: `Possible conflict: ${name} vs documented allergy`,
            assistOnly: true,
          });
        }
      });
    });
    return alerts;
  }

  static async buildAssistantPanel(patient, { visit = null, access = null } = {}) {
    const summary = await PatientSummaryService.buildSummary(patient, { access, visit });
    const pid = patient._id || patient;
    const alerts = [];

    (summary.cards.allergies || []).forEach((a) => {
      alerts.push({
        type: ALERT_TYPES.ALLERGY,
        severity: ALERT_SEVERITY.WARNING,
        message: `Allergy on file: ${a}`,
        assistOnly: true,
      });
    });

    summary.cards.abnormalVitals?.forEach((v) => {
      alerts.push({
        type: ALERT_TYPES.ABNORMAL_VITALS,
        severity: v.severity === 'critical' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        message: v.message,
        assistOnly: true,
      });
    });

    if (visit) {
      const vitalsFlags = evaluateVitals(visit.vitals);
      vitalsFlags.forEach((f) => {
        if (!alerts.find((a) => a.message === f.message)) {
          alerts.push({
            type: ALERT_TYPES.ABNORMAL_VITALS,
            severity: f.severity === 'critical' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
            message: f.message,
            assistOnly: true,
          });
        }
      });

      const pendingLabs = (visit.labOrders || []).filter((o) => o.status !== 'completed');
      if (pendingLabs.length) {
        alerts.push({
          type: ALERT_TYPES.LAB_PENDING,
          severity: ALERT_SEVERITY.INFO,
          message: `${pendingLabs.length} pending lab order(s): ${pendingLabs.map((l) => l.testName).join(', ')}`,
          assistOnly: true,
        });
      }

      if (
        ['LAB_REQUIRED', 'LAB_PENDING'].includes(visit.workflowState) &&
        pendingLabs.length > 0
      ) {
        const reports = await LabReport.countDocuments({ visit: visit._id });
        if (reports === 0) {
          alerts.push({
            type: ALERT_TYPES.MISSING_REPORT,
            severity: ALERT_SEVERITY.WARNING,
            message: 'Lab ordered — no report uploaded yet',
            assistOnly: true,
          });
        }
      }

      if (visit.surgery?.procedureName) {
        const daysSince = visit.surgery?.scheduledAt
          ? (Date.now() - new Date(visit.surgery.scheduledAt)) / 86400000
          : null;
        alerts.push({
          type: ALERT_TYPES.SURGERY,
          severity: ALERT_SEVERITY.INFO,
          message: `Surgery context: ${visit.surgery.procedureName}${daysSince != null && daysSince < 90 ? ' (recent)' : ''}`,
          assistOnly: true,
        });
      }
    }

    const recentRx = await Prescription.find({ patient: pid }).sort({ createdAt: -1 }).limit(3);
    recentRx.forEach((rx) => {
      const conflicts = this.checkMedicationConflicts(summary.cards.allergies, rx.medicines || []);
      alerts.push(...conflicts);
    });

    summary.cards.recentSurgeries?.forEach((s) => {
      if (s.date && (Date.now() - new Date(s.date)) / 86400000 < 90) {
        alerts.push({
          type: ALERT_TYPES.SURGERY,
          severity: ALERT_SEVERITY.WARNING,
          message: `Recent surgery: ${s.procedure || 'procedure'} at ${s.hospital || 'hospital'}`,
          assistOnly: true,
        });
      }
    });

    const sorted = alerts.sort((a, b) => {
      const rank = { critical: 0, warning: 1, info: 2 };
      return (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3);
    });

    return {
      assistOnly: true,
      disclaimer: summary.disclaimer,
      summary: summary.narrative,
      alerts: sorted,
      checklist: {
        reviewAllergies: summary.cards.allergies?.length > 0,
        reviewMeds: summary.cards.medications?.length > 0,
        reviewVitals: summary.cards.abnormalVitals?.length > 0,
        pendingLabs: alerts.some((a) => a.type === ALERT_TYPES.LAB_PENDING),
        surgeryContext: summary.cards.recentSurgeries?.length > 0,
      },
    };
  }
}

export default ClinicalAssistantService;
