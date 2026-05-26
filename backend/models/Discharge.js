import mongoose from 'mongoose';

const dischargeSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
    dischargedAt: { type: Date, default: Date.now },
    summary: { type: String },
    dischargeNotes: { type: String },
    dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dischargeSchema.index({ patient: 1, dischargedAt: -1 });

export default mongoose.model('Discharge', dischargeSchema);
