import Patient from '../models/Patient.js';
import { PatientAccessService } from '../modules/interoperability/patient-access.service.js';

/**
 * Resolves patient and verifies tenant/consent access for interoperability routes.
 */
export const requirePatientAccess = async (req, res, next) => {
  try {
    const patientIdParam = req.params.patientId;
    const patient = await Patient.findOne({ patientId: patientIdParam }).populate('user', 'name email');
    if (!patient) {
      res.status(404);
      return next(new Error('Patient not found'));
    }

    if (req.user.role === 'patient') {
      const own = await Patient.findOne({ user: req.user._id });
      if (own?._id.toString() !== patient._id.toString()) {
        res.status(403);
        return next(new Error('Not authorized'));
      }
      req.patient = patient;
      req.access = { allowed: true, reason: 'self', scopeLevel: 'full_access' };
      return next();
    }

    const access = await PatientAccessService.evaluateAccess({
      patient,
      staff: req.staff,
      tenant: req.tenant,
      operationalRole: req.operationalRole,
    });

    if (!access.allowed) {
      res.status(403);
      return next(
        new Error(
          access.reason === 'consent_required'
            ? 'Cross-hospital consent required — request access from patient'
            : 'Not authorized for this patient'
        )
      );
    }

    req.patient = patient;
    req.access = access;
    next();
  } catch (error) {
    next(error);
  }
};

export default requirePatientAccess;
