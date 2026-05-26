import HospitalVisit from '../../models/HospitalVisit.js';
import { WORKFLOW_STATES } from '../../../shared/constants/workflow.js';
import { evaluateVitals } from './vitals-rules.js';
import { ALERT_SEVERITY, ALERT_TYPES } from '../../../shared/constants/intelligence.js';
import { emitQueueUpdate } from '../notifications/socket.server.js';
import { SOCKET_EVENTS } from '../notifications/socket.events.js';

export class AlertEngineService {
  static async scanBranch({ tenantId, branchId, tenantSlug, branchSlug }) {
    const visits = await HospitalVisit.find({
      tenant: tenantId,
      branch: branchId,
      workflowState: { $ne: WORKFLOW_STATES.DISCHARGED },
    })
      .populate('patient')
      .limit(100)
      .lean();

    const alerts = [];

    for (const v of visits) {
      if (v.priority === 'critical' || v.priority === 'urgent') {
        alerts.push({
          type: ALERT_TYPES.EMERGENCY,
          severity: ALERT_SEVERITY.CRITICAL,
          visitId: v._id,
          tokenNumber: v.tokenNumber,
          message: `Emergency/urgent — Token ${v.tokenNumber || '—'}`,
        });
      }

      if (v.workflowState === WORKFLOW_STATES.BILLING_PENDING) {
        alerts.push({
          type: ALERT_TYPES.BILLING,
          severity: ALERT_SEVERITY.INFO,
          visitId: v._id,
          message: `Billing pending — ${v.tokenNumber || 'visit'}`,
        });
      }

      if (v.workflowState === WORKFLOW_STATES.SURGERY_SCHEDULED && v.surgery?.scheduledAt) {
        const hrs = (Date.now() - new Date(v.surgery.scheduledAt)) / 3600000;
        if (hrs > 24) {
          alerts.push({
            type: ALERT_TYPES.SURGERY,
            severity: ALERT_SEVERITY.WARNING,
            visitId: v._id,
            message: `Surgery scheduled >24h ago — ${v.surgery.procedureName || 'OT'}`,
          });
        }
      }

      evaluateVitals(v.vitals).forEach((f) => {
        alerts.push({
          type: ALERT_TYPES.ABNORMAL_VITALS,
          severity: f.severity === 'critical' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
          visitId: v._id,
          message: f.message,
        });
      });

      if (v.inpatient?.icu) {
        alerts.push({
          type: ALERT_TYPES.ICU_PLACEHOLDER,
          severity: ALERT_SEVERITY.WARNING,
          visitId: v._id,
          message: 'ICU / critical bed — enhanced monitoring suggested',
        });
      }
    }

    const patientVisitCounts = {};
    visits.forEach((v) => {
      const pid = v.patient?._id?.toString() || v.patient?.toString();
      if (pid) patientVisitCounts[pid] = (patientVisitCounts[pid] || 0) + 1;
    });
    Object.entries(patientVisitCounts).forEach(([, count]) => {
      if (count >= 2) {
        alerts.push({
          type: ALERT_TYPES.REPEAT_ADMISSION,
          severity: ALERT_SEVERITY.INFO,
          message: 'Repeat active visits — review readmission pattern',
        });
      }
    });

    if (tenantSlug && branchSlug && alerts.length) {
      emitQueueUpdate(tenantSlug, branchSlug, SOCKET_EVENTS.SMART_ALERT, {
        count: alerts.length,
        critical: alerts.filter((a) => a.severity === ALERT_SEVERITY.CRITICAL).length,
      });
    }

    return alerts.slice(0, 30);
  }
}

export default AlertEngineService;
