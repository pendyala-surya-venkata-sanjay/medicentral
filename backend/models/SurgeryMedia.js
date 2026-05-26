import mongoose from 'mongoose';

const surgeryMediaSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: 'Surgery update' },
    caption: { type: String },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, default: 'image' },
    visitDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

surgeryMediaSchema.index({ patient: 1, visitDate: -1 });

export default mongoose.model('SurgeryMedia', surgeryMediaSchema);
