import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String },
    actorName: { type: String },
    operationalRole: { type: String, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalTenant', index: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    action: { type: String, required: true, index: true },
    /** @deprecated use entity — kept for backward compatibility */
    resource: { type: String },
    resourceId: { type: String },
    entity: { type: String, index: true },
    entityId: { type: String, index: true },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: '0.0.0.0' },
    userAgent: { type: String },
    immutable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ tenant: 1, branch: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany'], function () {
  throw new Error('Audit logs are immutable');
});

export default mongoose.model('AuditLog', auditLogSchema);
