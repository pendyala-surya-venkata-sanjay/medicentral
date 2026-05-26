import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  dateOfVisit: { type: Date, default: Date.now },
  symptoms: [{ type: String }],
  diagnosis: { type: String, required: true },
  prescriptions: [{
    medicine: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String }
  }],
  labReports: [{
    testName: { type: String },
    reportUrl: { type: String }, // URL from cloud storage later
    date: { type: Date }
  }],
  doctorNotes: { type: String },
  followUpDate: { type: Date }
}, { timestamps: true });

medicalRecordSchema.index({ patient: 1, dateOfVisit: -1 });
medicalRecordSchema.index({ doctor: 1, createdAt: -1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
