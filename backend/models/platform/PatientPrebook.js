import mongoose from 'mongoose';

const patientPrebookSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    department: { type: String, default: 'General Medicine' },
    scheduledAt: { type: Date, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'checked_in', 'cancelled'],
      default: 'pending',
      index: true,
    },
    estimatedWaitMinutes: { type: Number, default: 15 },
    linkedVisit: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalVisit' },
  },
  { timestamps: true }
);

patientPrebookSchema.index({ patient: 1, status: 1, scheduledAt: 1 });

export default mongoose.models.PatientPrebook ||
  mongoose.model('PatientPrebook', patientPrebookSchema);
