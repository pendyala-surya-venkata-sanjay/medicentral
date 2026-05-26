import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    type: {
      type: String,
      enum: [
        'patient_forwarded',
        'queue_updated',
        'emergency',
        'lab_completed',
        'billing_pending',
        'consultation_started',
        'prescription_added',
        'consent_request',
        'consent_resolved',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
