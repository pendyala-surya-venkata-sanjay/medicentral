import Patient from '../models/Patient.js';
import { PatientAccessService } from '../modules/interoperability/patient-access.service.js';
import { GlobalTimelineService } from '../modules/interoperability/global-timeline.service.js';

/** Cross-hospital patient search (tenant staff — discovery only) */
export const searchPatientsInterop = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const results = await PatientAccessService.searchPatientsGlobal(q);

    const enriched = await Promise.all(
      results.map(async (r) => {
        const patient = await Patient.findOne({ patientId: r.patientId });
        const access = patient
          ? await PatientAccessService.evaluateAccess({
              patient,
              staff: req.staff,
              tenant: req.tenant,
              operationalRole: req.operationalRole,
            })
          : { allowed: false };

        const otherHospital = r.hospitals?.find(
          (h) => h.slug !== req.tenant?.slug
        );
        return {
          ...r,
          hasAccess: access.allowed,
          accessReason: access.reason,
          consentRequired: access.reason === 'consent_required',
          suggestedGrantingSlug: otherHospital?.slug || r.hospitals?.[0]?.slug,
        };
      })
    );

    res.json({ query: q, patients: enriched, requestingTenant: req.tenant });
  } catch (error) {
    next(error);
  }
};

export const getPatientEcosystemProfile = async (req, res, next) => {
  try {
    const { hospitals, visits } = await PatientAccessService.getPatientTenantHistory(
      req.patient._id
    );
    const timeline = await GlobalTimelineService.buildForPatient(req.patient, {
      access: req.access,
    });

    res.json({
      patient: {
        patientId: req.patient.patientId,
        name: req.patient.user?.name,
        contactNumber: req.patient.contactNumber,
      },
      hospitals,
      visitCount: visits.length,
      access: req.access,
      recentEvents: timeline.events.slice(0, 15),
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientGlobalTimeline = async (req, res, next) => {
  try {
    const timeline = await GlobalTimelineService.buildForPatient(req.patient, {
      access: req.access,
    });
    res.json(timeline);
  } catch (error) {
    next(error);
  }
};
