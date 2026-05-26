import mongoose from 'mongoose';
import { TIMELINE_EVENT_LIST } from '../../../shared/constants/timeline.js';

const timelineEventSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalVisit' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    type: { type: String, enum: TIMELINE_EVENT_LIST, required: true },
    title: { type: String, required: true },
    summary: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    sourceRef: { type: String },
    sourceModel: { type: String },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

timelineEventSchema.index({ patient: 1, occurredAt: -1 });
timelineEventSchema.index({ visit: 1 });

export default mongoose.models.TimelineEvent ||
  mongoose.model('TimelineEvent', timelineEventSchema);
