import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import AuditLog from '../../models/AuditLog.js';
import HospitalVisit from '../../models/HospitalVisit.js';
import WorkflowQueueItem from '../../models/platform/WorkflowQueueItem.js';
import { QUEUE_STATUS } from '../../../shared/constants/queues.js';
import { WORKFLOW_STATES } from '../../../shared/constants/workflow.js';
import { getSocketStats } from '../notifications/socket.server.js';
import { isStorageReady } from '../../config/storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '../../uploads');

export class HealthService {
  static async basic() {
    const dbState = mongoose.connection.readyState;
    return {
      status: dbState === 1 ? 'ok' : 'degraded',
      service: 'MediCentral API',
      timestamp: new Date().toISOString(),
      db: dbState === 1 ? 'connected' : 'disconnected',
      uptimeSec: Math.floor(process.uptime()),
    };
  }

  static async detailed() {
    const started = Date.now();
    const dbPing = await mongoose.connection.db?.admin().ping().catch(() => null);
    const dbLatencyMs = dbPing ? Date.now() - started : null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingQueues, recentAudit, uploadWritable] = await Promise.all([
      WorkflowQueueItem.countDocuments({
        status: { $in: [QUEUE_STATUS.PENDING, QUEUE_STATUS.IN_PROGRESS] },
      }),
      AuditLog.countDocuments({ createdAt: { $gte: since } }),
      HealthService.checkUploadsDir(),
    ]);

    const socket = getSocketStats();

    const [activeVisits, emergencies] = await Promise.all([
      HospitalVisit.countDocuments({
        workflowState: { $nin: [WORKFLOW_STATES.DISCHARGED] },
      }),
      HospitalVisit.countDocuments({ priority: { $in: ['urgent', 'critical'] } }),
    ]);

    const storage = isStorageReady();

    return {
      ...(await HealthService.basic()),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          ok: !!dbPing,
          latencyMs: dbLatencyMs,
        },
        websocket: socket,
        queues: { pendingItems: pendingQueues },
        audit: { eventsLast24h: recentAudit },
        uploads: { writable: uploadWritable, storage },
        workflows: { activeVisits, emergencies },
      },
      ecosystemHealth:
        dbPing && pendingQueues < 500 ? 'operational' : pendingQueues >= 500 ? 'degraded' : 'critical',
    };
  }

  /** Launch / investor dashboard metrics */
  static async launchMetrics() {
    const detailed = await HealthService.detailed();
    const workflowBreakdown = await HospitalVisit.aggregate([
      { $match: { workflowState: { $ne: WORKFLOW_STATES.DISCHARGED } } },
      { $group: { _id: '$workflowState', count: { $sum: 1 } } },
    ]);
    return {
      ...detailed,
      launchReady: detailed.checks?.database?.ok && detailed.status === 'ok',
      workflowBreakdown,
      presentationMode: process.env.PRESENTATION_MODE === 'true',
    };
  }

  static checkUploadsDir() {
    try {
      fs.accessSync(uploadsRoot, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

export default HealthService;
