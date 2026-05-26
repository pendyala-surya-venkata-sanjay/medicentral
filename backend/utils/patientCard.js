import Patient from '../models/Patient.js';
import HospitalVisit from '../models/HospitalVisit.js';
import PatientDocument from '../models/PatientDocument.js';
import Prescription from '../models/Prescription.js';
import MedicalRecord from '../models/MedicalRecord.js';

export const buildPatientCard = async (patient, visit = null) => {
  const pid = patient._id || patient;
  const [visitCount, documentCount, recentPrescriptions, recentRecords] = await Promise.all([
    HospitalVisit.countDocuments({ patient: pid }),
    PatientDocument.countDocuments({ patient: pid }),
    Prescription.find({ patient: pid }).sort({ createdAt: -1 }).limit(3).lean(),
    MedicalRecord.find({ patient: pid }).sort({ dateOfVisit: -1 }).limit(3).lean(),
  ]);

  const waitMinutes = visit?.checkIn
    ? Math.max(0, Math.floor((Date.now() - new Date(visit.checkIn)) / 60000))
    : 0;

  return {
    patientId: patient.patientId,
    name: patient.user?.name || 'Patient',
    email: patient.user?.email,
    age: patient.age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    contactNumber: patient.contactNumber,
    allergies: patient.allergies || [],
    ongoingMedications: patient.ongoingMedications || [],
    visitCount,
    documentCount,
    recentPrescriptions,
    recentRecords,
    vitals: visit?.vitals,
    visit: visit
      ? {
          _id: visit._id,
          tokenNumber: visit.tokenNumber,
          workflowState: visit.workflowState,
          priority: visit.priority,
          department: visit.department,
          visitType: visit.visitType,
          checkIn: visit.checkIn,
          waitMinutes,
          paPrepNotes: visit.paPrepNotes,
          symptomNotes: visit.symptomNotes,
          consultationNotes: visit.consultationNotes,
          labInstructions: visit.labInstructions,
          labOrders: visit.labOrders || [],
          diagnosisSummary: visit.diagnosisSummary,
          isPrebooked: visit.isPrebooked,
          estimatedWaitMinutes: visit.estimatedWaitMinutes,
          isFollowUp: visit.isFollowUp,
          inpatient: visit.inpatient,
          surgery: visit.surgery,
          pharmacyFulfillment: visit.pharmacyFulfillment || [],
          nursingNotes: (visit.nursingNotes || []).slice(-3),
          vitalsLog: (visit.vitalsLog || []).slice(-5),
          discharge: visit.discharge,
        }
      : null,
  };
};

export const buildQueueCards = async (visits) => {
  const cards = [];
  for (const visit of visits) {
    const patient = visit.patient;
    if (!patient?.patientId) continue;
    cards.push(await buildPatientCard(patient, visit));
  }
  return cards;
};
