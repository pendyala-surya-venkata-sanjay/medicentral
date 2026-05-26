import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    roomNumber: { type: String, required: true },
    ward: { type: String, default: 'General' },
    bedType: { type: String, enum: ['general', 'icu', 'emergency'], default: 'general' },
    admittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'discharged'], default: 'active' },
    admissionNotes: { type: String },
    attendingDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  },
  { timestamps: true }
);

admissionSchema.index({ status: 1, admittedAt: -1 });
admissionSchema.index({ patient: 1 });

export default mongoose.model('Admission', admissionSchema);
