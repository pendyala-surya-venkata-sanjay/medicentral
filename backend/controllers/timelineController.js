import { resolvePatientFromRequest } from '../utils/mediaAccess.js';
import { GlobalTimelineService } from '../modules/interoperability/global-timeline.service.js';
import { PatientAccessService } from '../modules/interoperability/patient-access.service.js';
import { attachStaffContext } from '../modules/auth/attachStaffContext.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AUDIT_ACTIONS } from '../modules/audit/audit.actions.js';
import { parsePagination } from '../utils/pagination.js';

export const getPatientTimeline = async (req, res, next) => {
  try {
    const patient = await resolvePatientFromRequest(req.user, req.params.patientId);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    let access = { allowed: true, reason: 'self', scopeLevel: 'full_access' };

    if (req.user.role !== 'patient') {
      if (!req.staff && (req.user.role === 'staff' || req.user.role === 'admin')) {
        await new Promise((resolve, reject) => {
          attachStaffContext(req, res, (err) => (err ? reject(err) : resolve()));
        });
      }
      access = await PatientAccessService.evaluateAccess({
        patient,
        staff: req.staff,
        tenant: req.tenant,
        operationalRole: req.operationalRole,
      });
      if (!access.allowed) {
        res.status(403);
        throw new Error(
          access.reason === 'consent_required'
            ? 'Cross-hospital consent required'
            : 'Not authorized'
        );
      }
    }

    const { limit, skip } = parsePagination(req.query, { defaultLimit: 80, maxLimit: 300 });

    const timeline = await GlobalTimelineService.buildForPatient(patient, {
      access,
      limit,
      skip,
    });

    await AuditService.record({
      req,
      action: AUDIT_ACTIONS.TIMELINE_VIEW,
      entity: 'patient',
      entityId: patient.patientId,
      meta: { limit, skip, reason: access.reason },
    });

    res.json(timeline);
  } catch (error) {
    next(error);
  }
};
