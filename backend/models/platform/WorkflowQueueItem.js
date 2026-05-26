import mongoose from 'mongoose';
import { QUEUE_TYPE_LIST, QUEUE_STATUS } from '../../../shared/constants/queues.js';

const workflowQueueItemSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalVisit', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    queueType: { type: String, enum: QUEUE_TYPE_LIST, required: true },
    status: {
      type: String,
      enum: Object.values(QUEUE_STATUS),
      default: QUEUE_STATUS.PENDING,
    },
    priority: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    workflowState: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    dueAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

workflowQueueItemSchema.index({ tenant: 1, branch: 1, queueType: 1, status: 1 });
workflowQueueItemSchema.index({ visit: 1, queueType: 1 });

export default mongoose.models.WorkflowQueueItem ||
  mongoose.model('WorkflowQueueItem', workflowQueueItemSchema);
