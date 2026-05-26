import mongoose from 'mongoose';

const hospitalTenantSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    /** Legacy unique key — kept in sync with slug for older DB indexes */
    orgCode: { type: String, unique: true, sparse: true, lowercase: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    branding: {
      primaryColor: { type: String },
      logoUrl: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.models.HospitalTenant ||
  mongoose.model('HospitalTenant', hospitalTenantSchema);
