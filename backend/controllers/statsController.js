import MedicalRecord from '../models/MedicalRecord.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';

// @desc    Doctor dashboard analytics (real data)
// @route   GET /api/stats/doctor
// @access  Private/Doctor
export const getDoctorStats = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found');
    }

    const doctorRecords = await MedicalRecord.find({ doctor: doctor._id }).sort({ createdAt: -1 });

    const uniquePatients = new Set(doctorRecords.map((r) => r.patient.toString())).size;
    const totalRecords = doctorRecords.length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyConsultations = doctorRecords.filter((r) => new Date(r.createdAt) >= weekAgo).length;

    const highSeverityKeywords = ['critical', 'severe', 'emergency', 'acute'];
    const criticalAlerts = doctorRecords.filter((r) =>
      highSeverityKeywords.some((kw) => (r.diagnosis || '').toLowerCase().includes(kw))
    ).length;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const traffic = dayNames.map((name, dayIndex) => {
      const count = doctorRecords.filter((r) => new Date(r.createdAt).getDay() === dayIndex).length;
      return { name, patients: count };
    });

    const totalPatientsInSystem = await Patient.countDocuments();

    res.json({
      totalPatientsInSystem,
      uniquePatientsSeen: uniquePatients,
      totalRecords,
      weeklyConsultations,
      criticalAlerts,
      traffic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Patient dashboard summary
// @route   GET /api/stats/patient
// @access  Private/Patient
export const getPatientStats = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    const records = await MedicalRecord.find({ patient: patient._id }).sort({ dateOfVisit: -1 });

    const lastVisit = records[0]?.dateOfVisit ?? records[0]?.createdAt ?? null;

    const meds = new Set();
    records.forEach((r) => {
      (r.prescriptions || []).forEach((p) => {
        if (p?.medicine) meds.add(p.medicine);
      });
    });

    const visitsByMonth = {};
    records.forEach((r) => {
      const d = new Date(r.dateOfVisit || r.createdAt);
      const key = d.toLocaleString('en-US', { month: 'short' });
      visitsByMonth[key] = (visitsByMonth[key] || 0) + 1;
    });

    const chartData = Object.entries(visitsByMonth).map(([month, visits]) => ({
      month,
      visits,
    }));

    const prescriptions = await Prescription.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const followUps = prescriptions
      .filter((rx) => rx.followUpDate)
      .map((rx) => ({
        date: rx.followUpDate,
        diagnosis: rx.diagnosis,
        doctorName: rx.doctorName,
      }));

    const rxMeds = new Set();
    prescriptions.forEach((rx) => {
      (rx.medicines || []).forEach((m) => m.medicine && rxMeds.add(m.medicine));
    });
    patient.ongoingMedications?.forEach((m) => rxMeds.add(m));

    const healthScore = Math.min(
      100,
      50 + records.length * 5 + (patient.bloodGroup ? 10 : 0) + (patient.emergencyContact?.phone ? 10 : 0)
    );

    res.json({
      patientId: patient.patientId,
      totalRecords: records.length,
      lastVisit,
      activeMedicationsCount: rxMeds.size || meds.size,
      chartData: chartData.length ? chartData : [{ month: '—', visits: 0 }],
      healthScore,
      allergies: patient.allergies || [],
      ongoingMedications: [...rxMeds],
      followUps,
      profile: {
        bloodGroup: patient.bloodGroup,
        gender: patient.gender,
        age: patient.age,
        state: patient.address?.state,
        city: patient.address?.city,
        district: patient.address?.district,
        pincode: patient.address?.pincode,
        emergencyContact: patient.emergencyContact,
        guardian: patient.guardian,
      },
    });
  } catch (error) {
    next(error);
  }
};
