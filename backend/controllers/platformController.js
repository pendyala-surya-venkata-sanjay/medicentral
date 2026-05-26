import Patient from '../models/Patient.js';
import { EcosystemService } from '../modules/interoperability/ecosystem.service.js';
import { PatientAccessService } from '../modules/interoperability/patient-access.service.js';
import { GlobalTimelineService } from '../modules/interoperability/global-timeline.service.js';

export const getPlatformOverview = async (req, res, next) => {
  try {
    const tenants = await EcosystemService.getTenantOverview();
    const analytics = await EcosystemService.getNetworkAnalytics();
    res.json({ tenants, analytics });
  } catch (error) {
    next(error);
  }
};

export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const analytics = await EcosystemService.getNetworkAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

export const getPlatformActivityFeed = async (req, res, next) => {
  try {
    const feed = await EcosystemService.getActivityFeed({ limit: 50 });
    res.json({ feed });
  } catch (error) {
    next(error);
  }
};

export const searchPatientsPlatform = async (req, res, next) => {
  try {
    const results = await PatientAccessService.searchPatientsGlobal(req.query.q || '');
    res.json({ patients: results });
  } catch (error) {
    next(error);
  }
};

export const getPatientEcosystemPlatform = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId }).populate(
      'user',
      'name email'
    );
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const { hospitals, visits } = await PatientAccessService.getPatientTenantHistory(patient._id);
    const timeline = await GlobalTimelineService.buildForPatient(patient, {
      access: { allowed: true, reason: 'platform', scopeLevel: 'full_access' },
    });
    const consents = await (await import('../models/platform/ConsentAccess.js')).default
      .find({ patient: patient._id })
      .populate('requestingTenant', 'name slug')
      .populate('grantingTenant', 'name slug')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json({
      patient: {
        patientId: patient.patientId,
        name: patient.user?.name,
        contactNumber: patient.contactNumber,
        aadhaarLast4: patient.aadhaarLast4,
      },
      hospitals,
      visits: visits.length,
      timeline: timeline.events,
      consents,
    });
  } catch (error) {
    next(error);
  }
};
