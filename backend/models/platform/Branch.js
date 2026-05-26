import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant', required: true },
    slug: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    address: { type: String },
    phone: { type: String },
    bookingPhone: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ tenant: 1, slug: 1 }, { unique: true });

export default mongoose.models.Branch || mongoose.model('Branch', branchSchema);
