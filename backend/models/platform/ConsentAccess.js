import mongoose from 'mongoose';
import { CONSENT_STATUS } from '../../../shared/constants/timeline.js';

const consentAccessSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    requestingTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalTenant',
      required: true,
    },
    grantingTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant' },
    status: {
      type: String,
      enum: Object.values(CONSENT_STATUS),
      default: CONSENT_STATUS.PENDING,
    },
    scope: [{ type: String }],
    scopeLevel: {
      type: String,
      enum: ['timeline_only', 'reports_only', 'full_access'],
      default: 'full_access',
    },
    accessDuration: {
      type: String,
      enum: ['temporary', 'permanent'],
      default: 'temporary',
    },
    approvedAt: { type: Date },
    expiresAt: { type: Date },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    notes: { type: String },
  },
  { timestamps: true }
);

consentAccessSchema.index({ patient: 1, requestingTenant: 1, status: 1 });
consentAccessSchema.index({ grantingTenant: 1, status: 1 });
consentAccessSchema.index({ expiresAt: 1 });

export default mongoose.models.ConsentAccess ||
  mongoose.model('ConsentAccess', consentAccessSchema);
