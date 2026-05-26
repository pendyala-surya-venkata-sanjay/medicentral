import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true },
    dosage: { type: String },
    duration: { type: String },
    durationDays: { type: Number, min: 1 },
    frequency: { type: String },
    timing: { type: String },
    instructions: { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientName: { type: String, required: true },
    doctorName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: [{ type: String }],
    diagnosis: { type: String, required: true },
    medicines: [medicineSchema],
    clinicalNotes: { type: String },
    notes: { type: String },
    followUpDate: { type: Date },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalVisit' },
    record: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

export default mongoose.model('Prescription', prescriptionSchema);
