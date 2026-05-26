import mongoose from 'mongoose';

const labReportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalVisit' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    testName: { type: String, required: true },
    category: { type: String, default: 'pathology' },
    result: { type: String },
    normalRange: { type: String },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    reportUrl: { type: String },
    notes: { type: String },
    orderedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

labReportSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model('LabReport', labReportSchema);
