import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Prescription from '../models/Prescription.js';
import VoiceNote from '../models/VoiceNote.js';
import SurgeryMedia from '../models/SurgeryMedia.js';
import Billing from '../models/Billing.js';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientDocument from '../models/PatientDocument.js';

export const getPatientProfile = async (user) => {
  if (user.role !== 'patient') return null;
  return Patient.findOne({ user: user._id });
};

export const getDoctorProfile = async (user) => {
  if (user.role !== 'doctor') return null;
  return Doctor.findOne({ user: user._id });
};

export const canAccessPatient = async (user, patientObjId) => {
  if (user.role === 'staff' || user.role === 'admin') return true;

  const patientProfile = await getPatientProfile(user);
  if (patientProfile && patientProfile._id.toString() === patientObjId.toString()) {
    return true;
  }

  if (user.role === 'doctor') {
    const doctor = await getDoctorProfile(user);
    if (!doctor) return false;
    const patientExists = await Patient.exists({ _id: patientObjId });
    return !!patientExists;
  }

  return false;
};

export const resolvePatientFromRequest = async (user, patientIdParam) => {
  if (user.role === 'patient') {
    const profile = await getPatientProfile(user);
    if (!profile) return null;
    return profile;
  }
  if (patientIdParam) {
    return Patient.findOne({ patientId: patientIdParam });
  }
  return null;
};

export const canAccessMediaFile = async (user, filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  const url = normalized.startsWith('/uploads') ? normalized : `/uploads/${normalized}`;

  const record = await MedicalRecord.findOne({
    $or: [{ 'labReports.reportUrl': url }, { 'labReports.reportUrl': { $regex: normalized } }],
  });
  if (record) return canAccessPatient(user, record.patient);

  const voice = await VoiceNote.findOne({
    $or: [{ audioUrl: url }, { audioUrl: { $regex: normalized } }],
  });
  if (voice) return canAccessPatient(user, voice.patient);

  const media = await SurgeryMedia.findOne({
    $or: [{ mediaUrl: url }, { mediaUrl: { $regex: normalized } }],
  });
  if (media) return canAccessPatient(user, media.patient);

  const bill = await Billing.findOne({
    $or: [{ invoiceUrl: url }, { invoiceUrl: { $regex: normalized } }],
  });
  if (bill) return canAccessPatient(user, bill.patient);

  const patientDoc = await PatientDocument.findOne({
    $or: [{ fileUrl: url }, { fileUrl: { $regex: normalized } }],
  });
  if (patientDoc) return canAccessPatient(user, patientDoc.patient);

  if (user.role === 'staff' || user.role === 'admin') return true;

  return false;
};
