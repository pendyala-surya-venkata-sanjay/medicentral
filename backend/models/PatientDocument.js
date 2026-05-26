import mongoose from 'mongoose';

const CATEGORIES = [
  'prescription',
  'scan',
  'lab_report',
  'surgery_record',
  'insurance',
  'discharge_summary',
  'other',
];

const patientDocumentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'other',
    },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    source: { type: String, enum: ['patient', 'doctor', 'staff'], default: 'patient' },
    aiExtraction: {
      documentType: String,
      detectedMedicines: [String],
      detectedTests: [String],
      tags: [String],
      source: { type: String, default: 'heuristic' },
      analyzedAt: Date,
    },
  },
  { timestamps: true }
);

patientDocumentSchema.index({ patient: 1, createdAt: -1 });
patientDocumentSchema.index({ category: 1 });

export { CATEGORIES };
export default mongoose.model('PatientDocument', patientDocumentSchema);
