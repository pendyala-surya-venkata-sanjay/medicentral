import mongoose from 'mongoose';
import { OPERATIONAL_ROLES, TENANT_ROLES, PLATFORM_ROLES } from '../../../shared/constants/roles.js';

const STAFF_ROLES = [...PLATFORM_ROLES, ...TENANT_ROLES, ...OPERATIONAL_ROLES];

const staffSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    operationalRole: {
      type: String,
      enum: STAFF_ROLES,
      required: true,
    },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.index({ tenant: 1, branch: 1, operationalRole: 1 });

export default mongoose.models.Staff || mongoose.model('Staff', staffSchema);
