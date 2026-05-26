import mongoose from 'mongoose';

const voiceNoteSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    title: { type: String, default: 'Clinical voice note' },
    description: { type: String },
    audioUrl: { type: String, required: true },
    durationSeconds: { type: Number },
    mimeType: { type: String },
    fileSize: { type: Number },
    category: {
      type: String,
      enum: ['general', 'surgery', 'emergency', 'progress'],
      default: 'general',
    },
  },
  { timestamps: true }
);

voiceNoteSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model('VoiceNote', voiceNoteSchema);
