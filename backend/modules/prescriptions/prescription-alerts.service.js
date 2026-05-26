import Prescription from '../../models/Prescription.js';
import { parseDurationDays } from '../../utils/parseDurationDays.js';

const endDateForMedicine = (rx, med) => {
  const days = med.durationDays ?? parseDurationDays(med.duration);
  if (!days) return null;
  const start = new Date(rx.createdAt || rx.date || Date.now());
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return { days, end, start };
};

export class PrescriptionAlertsService {
  static async getActiveAlertsForPatient(patientMongoId) {
    const prescriptions = await Prescription.find({ patient: patientMongoId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const now = new Date();
    const alerts = [];

    for (const rx of prescriptions) {
      for (const med of rx.medicines || []) {
        const parsed = endDateForMedicine(rx, med);
        if (!parsed || now > parsed.end) continue;

        const msLeft = parsed.end - now;
        const daysRemaining = Math.max(0, Math.ceil(msLeft / 86400000));

        alerts.push({
          id: `${rx._id}-${med.medicine}`,
          prescriptionId: rx._id.toString(),
          medicine: med.medicine,
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          timing: med.timing || '',
          instructions: med.instructions || '',
          durationDays: parsed.days,
          startedAt: parsed.start.toISOString(),
          endsAt: parsed.end.toISOString(),
          daysRemaining,
          doctorName: rx.doctorName,
          diagnosis: rx.diagnosis,
        });
      }
    }

    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return alerts;
  }
}

export default PrescriptionAlertsService;
