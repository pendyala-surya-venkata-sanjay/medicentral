import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    billing: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true },
    method: { type: String, default: 'cash' },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ billing: 1 });
paymentSchema.index({ patient: 1, paidAt: -1 });

export default mongoose.model('Payment', paymentSchema);
