import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  patientId: { type: String, required: true, unique: true },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
  contactNumber: { type: String },
  aadhaarLast4: { type: String },
  address: {
    line1: { type: String },
    city: { type: String },
    district: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },
  guardian: {
    name: { type: String },
    phone: { type: String },
    relation: { type: String },
  },
  allergies: [{ type: String }],
  ongoingMedications: [{ type: String }],
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
