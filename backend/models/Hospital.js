import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String },
  contactNumber: { type: String },
  emergencyNumber: { type: String },
  facilities: [{ type: String }], // e.g., ICU, NICU, MRI
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
