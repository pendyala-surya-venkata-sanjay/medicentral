import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['upi', 'cash', 'card', 'insurance', 'netbanking'],
      default: 'cash',
    },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String },
  },
  { _id: true }
);

const billingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalVisit' },
    invoiceNumber: { type: String, unique: true, sparse: true },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        category: {
          type: String,
          enum: ['consultation', 'pharmacy', 'lab', 'surgery', 'room', 'procedure', 'other'],
          default: 'consultation',
        },
      },
    ],
    subtotal: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
    insuranceStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    insuranceProvider: { type: String },
    dueDate: { type: Date },
    invoiceUrl: { type: String },
    notes: { type: String },
    payments: [paymentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

billingSchema.index({ patient: 1, createdAt: -1 });
billingSchema.index({ status: 1 });

export default mongoose.model('Billing', billingSchema);
