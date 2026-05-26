import Patient from '../models/Patient.js';
import HospitalVisit from '../models/HospitalVisit.js';
import PatientPrebook from '../models/platform/PatientPrebook.js';
import ConsentAccess from '../models/platform/ConsentAccess.js';
import LabReport from '../models/LabReport.js';
import Prescription from '../models/Prescription.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import { CONSENT_STATUS } from '../../shared/constants/timeline.js';
import { WORKFLOW_STATES } from '../../shared/constants/workflow.js';
import { PatientSummaryService } from '../modules/intelligence/patient-summary.service.js';
import { PrescriptionAlertsService } from '../modules/prescriptions/prescription-alerts.service.js';

const greetingForHour = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getPatientCockpit = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id }).populate('user', 'name');
    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    const [approvedConsents, pendingConsents, activeVisit, pendingPrebook, pendingLabs, recentRx, prescriptionAlerts] =
      await Promise.all([
        ConsentAccess.countDocuments({
          patient: patient._id,
          status: CONSENT_STATUS.APPROVED,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }),
        ConsentAccess.countDocuments({ patient: patient._id, status: CONSENT_STATUS.PENDING }),
        HospitalVisit.findOne({
          patient: patient._id,
          workflowState: { $nin: [WORKFLOW_STATES.DISCHARGED] },
          timelineOpen: { $ne: false },
        })
          .sort({ checkIn: -1 })
          .populate('tenant', 'name slug')
          .populate('branch', 'name city')
          .lean(),
        PatientPrebook.findOne({ patient: patient._id, status: 'pending' })
          .sort({ scheduledAt: 1 })
          .populate('tenant', 'name')
          .populate('branch', 'name city')
          .lean(),
        LabReport.countDocuments({
          patient: patient._id,
          status: { $in: ['pending', 'in_progress', 'ordered'] },
        }),
        Prescription.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(1).lean(),
        PrescriptionAlertsService.getActiveAlertsForPatient(patient._id),
      ]);

    let aiSummary = null;
    try {
      aiSummary = await PatientSummaryService.buildSummary(patient, {
        visit: activeVisit,
      });
    } catch {
      aiSummary = null;
    }

    const hospitalsWithAccess = new Set();
    if (activeVisit?.tenant?.name) hospitalsWithAccess.add(activeVisit.tenant.name);
    const consentGrants = await ConsentAccess.find({
      patient: patient._id,
      status: CONSENT_STATUS.APPROVED,
    })
      .populate('grantingTenant', 'name')
      .populate('requestingTenant', 'name')
      .limit(20)
      .lean();
    consentGrants.forEach((c) => {
      if (c.grantingTenant?.name) hospitalsWithAccess.add(c.grantingTenant.name);
      if (c.requestingTenant?.name) hospitalsWithAccess.add(c.requestingTenant.name);
    });

    res.json({
      greeting: greetingForHour(),
      patientName: patient.user?.name || 'Patient',
      patientId: patient.patientId,
      consent: {
        approved: approvedConsents,
        pending: pendingConsents,
        hospitalsWithAccess: [...hospitalsWithAccess],
      },
      activeTreatment: activeVisit
        ? {
            workflowState: activeVisit.workflowState,
            department: activeVisit.department,
            tokenNumber: activeVisit.tokenNumber,
            hospital: activeVisit.tenant?.name,
            branch: activeVisit.branch?.name || activeVisit.branch?.city,
            isPrebooked: activeVisit.isPrebooked,
          }
        : null,
      prebook: pendingPrebook,
      pendingReports: pendingLabs,
      prescriptionAlerts,
      lastConsultation: recentRx[0]
        ? {
            diagnosis: recentRx[0].diagnosis,
            doctorName: recentRx[0].doctorName,
            date: recentRx[0].createdAt,
          }
        : null,
      emergencyProfile: {
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies || [],
        emergencyContact: patient.emergencyContact,
        patientId: patient.patientId,
      },
      aiSummary: aiSummary
        ? {
            narrative: aiSummary.narrative,
            riskIndicators: aiSummary.riskIndicators?.slice(0, 4),
            stats: aiSummary.stats,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

export const createPatientPrebook = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    const existing = await PatientPrebook.findOne({ patient: patient._id, status: 'pending' });
    if (existing) {
      res.status(400);
      throw new Error('You already have a pending pre-booking. Cancel or wait for check-in.');
    }

    const { department, scheduledAt, notes, tenantSlug, branchSlug } = req.body;
    if (!scheduledAt) {
      res.status(400);
      throw new Error('scheduledAt is required');
    }

    const defaults = await TenantService.getDefaultBranch();
    let tenant = defaults.tenant;
    let branch = defaults.branch;

    if (tenantSlug) {
      const resolved = await TenantService.resolveTenantBranch(tenantSlug, branchSlug || null);
      if (resolved?.tenant) tenant = resolved.tenant;
      if (resolved?.branch) branch = resolved.branch;
    }

    const scheduled = new Date(scheduledAt);
    const prebook = await PatientPrebook.create({
      patient: patient._id,
      tenant: tenant._id,
      branch: branch._id,
      department: department || 'General Medicine',
      scheduledAt: scheduled,
      notes,
      estimatedWaitMinutes: 12,
      status: 'pending',
    });

    await prebook.populate('tenant branch');
    res.status(201).json({
      prebook,
      message: 'VIP pre-booking confirmed. Show your Patient ID at reception for priority check-in.',
      estimatedWaitMinutes: prebook.estimatedWaitMinutes,
    });
  } catch (error) {
    next(error);
  }
};

export const listRegisteredHospitalsForPatient = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const hospitals = await TenantService.listRegisteredHospitals({ lat, lng });
    res.json(hospitals);
  } catch (error) {
    next(error);
  }
};

export const cancelPatientPrebook = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    const prebook = await PatientPrebook.findOne({
      _id: req.params.id,
      patient: patient?._id,
      status: 'pending',
    });
    if (!prebook) {
      res.status(404);
      throw new Error('Pre-booking not found');
    }
    prebook.status = 'cancelled';
    await prebook.save();
    res.json({ message: 'Pre-booking cancelled' });
  } catch (error) {
    next(error);
  }
};

export default {
  getPatientCockpit,
  createPatientPrebook,
  cancelPatientPrebook,
  listRegisteredHospitalsForPatient,
};
