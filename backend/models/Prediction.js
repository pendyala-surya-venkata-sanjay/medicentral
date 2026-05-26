import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: [{ type: String, required: true }],
  predictedDisease: { type: String, required: true },
  confidenceScore: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  precautions: [{ type: String }],
  specialistSuggested: { type: String }
}, { timestamps: true });

predictionSchema.index({ user: 1, createdAt: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
