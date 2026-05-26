import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  doctorId: { type: String, required: true, unique: true },
  specialization: { type: String, required: true },
  department: { type: String, default: 'General Medicine' },
  experienceYears: { type: Number },
  qualification: { type: String },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  contactNumber: { type: String },
  consultationFee: { type: Number },
  available: { type: Boolean, default: true },
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
