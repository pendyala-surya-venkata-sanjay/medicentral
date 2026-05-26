import Patient from '../models/Patient.js';
import HospitalVisit from '../models/HospitalVisit.js';
import Admission from '../models/Admission.js';
import Discharge from '../models/Discharge.js';
import Billing from '../models/Billing.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { generateTokenNumber, INDIAN_DEPARTMENTS } from '../utils/indiaHealthcare.js';
import { logActivity } from '../utils/auditLogger.js';
import { TenantService } from '../modules/tenants/tenant.service.js';
import { WorkflowEngine } from '../modules/workflows/workflow.engine.js';
import { QueueService } from '../modules/queues/queue.service.js';
import { TimelineService } from '../modules/timeline/timeline.service.js';
import { WORKFLOW_STATES } from '../../shared/constants/workflow.js';
import { QUEUE_TYPES } from '../../shared/constants/queues.js';

export const getHospitalAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      activeAdmissions,
      todayVisits,
      emergencyVisits,
      pendingBills,
      paidRevenue,
      doctors,
    ] = await Promise.all([
      Patient.countDocuments(),
      Admission.countDocuments({ status: 'active' }),
      HospitalVisit.countDocuments({ checkIn: { $gte: today } }),
      HospitalVisit.countDocuments({ status: 'emergency' }),
      Billing.countDocuments({ status: { $in: ['pending', 'partial'] } }),
      Billing.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Doctor.countDocuments(),
    ]);

    const visitsByStatus = await HospitalVisit.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const bedOccupancy = await Admission.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$bedType', count: { $sum: 1 } } },
    ]);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = await HospitalVisit.countDocuments({
        checkIn: { $gte: d, $lt: next },
      });
      last7Days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        patients: count,
      });
    }

    const departmentLoad = await HospitalVisit.aggregate([
      { $match: { checkIn: { $gte: today } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    res.json({
      totalPatients,
      activeAdmissions,
      todayVisits,
      emergencyVisits,
      pendingBills,
      totalRevenue: paidRevenue[0]?.total || 0,
      doctorCount: doctors,
      visitsByStatus: visitsByStatus?.length ? visitsByStatus : [{ _id: 'waiting', count: 0 }],
      bedOccupancy: bedOccupancy?.length ? bedOccupancy : [{ _id: 'general', count: 0 }],
      dailyPatients: last7Days?.length ? last7Days : [{ day: '—', patients: 0 }],
      departmentLoad,
      currency: 'INR',
    });
  } catch (error) {
    next(error);
  }
};

export const createVisit = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const dept = INDIAN_DEPARTMENTS.includes(req.body.department)
      ? req.body.department
      : req.body.department || 'General Medicine';

    const tokenNumber = await generateTokenNumber(HospitalVisit);

    let tenant = null;
    let branch = null;
    if (req.body.tenantSlug && req.body.branchSlug) {
      tenant = await TenantService.getTenantBySlug(req.body.tenantSlug);
      branch = tenant
        ? await TenantService.getBranch(req.body.tenantSlug, req.body.branchSlug)
        : null;
    }
    if (!tenant || !branch) {
      const defaults = await TenantService.getDefaultBranch();
      tenant = defaults.tenant;
      branch = defaults.branch;
    }

    const legacyStatus = req.body.status || 'waiting';
    const workflowState =
      req.body.workflowState ||
      WorkflowEngine.mapLegacyStatus(legacyStatus) ||
      WorkflowEngine.getInitialState();

    const visit = await HospitalVisit.create({
      patient: patient._id,
      tenant: tenant?._id,
      branch: branch?._id,
      visitType: req.body.visitType === 'IP' ? 'IP' : 'OP',
      tokenNumber,
      department: dept,
      status: legacyStatus,
      workflowState,
      currentQueueType: WorkflowEngine.getQueueForState(workflowState) || QUEUE_TYPES.RECEPTION,
      priority: req.body.priority || 'normal',
      notes: req.body.notes,
      assignedDoctor: req.body.doctorId || undefined,
    });

    if (tenant && branch) {
      await QueueService.enqueueForVisit({
        visit,
        patient,
        tenant,
        branch,
        workflowState,
        priority: visit.priority,
      }).catch(() => {});

      await TimelineService.appendEvent({
        patient,
        visit,
        tenant,
        branch,
        type: 'visit',
        title: `Visit registered — ${dept}`,
        summary: `Token ${tokenNumber} · ${workflowState}`,
        sourceRef: visit._id,
        sourceModel: 'HospitalVisit',
      }).catch(() => {});
    }

    await logActivity(req, 'visit_created', 'hospital_visit', visit._id, { tokenNumber });
    res.status(201).json(visit);
  } catch (error) {
    next(error);
  }
};

export const updateVisit = async (req, res, next) => {
  try {
    const visit = await HospitalVisit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!visit) {
      res.status(404);
      throw new Error('Visit not found');
    }
    if (req.body.status === 'completed' && !visit.checkOut) {
      visit.checkOut = new Date();
      await visit.save();
    }
    res.json(visit);
  } catch (error) {
    next(error);
  }
};

export const getVisits = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const visits = await HospitalVisit.find(filter)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .sort({ checkIn: -1 })
      .limit(50);
    res.json(visits);
  } catch (error) {
    next(error);
  }
};

export const admitPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const admission = await Admission.create({
      patient: patient._id,
      roomNumber: req.body.roomNumber,
      ward: req.body.ward || 'General',
      bedType: req.body.bedType || 'general',
      admissionNotes: req.body.admissionNotes,
      attendingDoctor: req.body.doctorId,
    });

    res.status(201).json(admission);
  } catch (error) {
    next(error);
  }
};

export const dischargePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const activeAdmission = await Admission.findOne({ patient: patient._id, status: 'active' });
    if (activeAdmission) {
      activeAdmission.status = 'discharged';
      await activeAdmission.save();
    }

    const discharge = await Discharge.create({
      patient: patient._id,
      admission: activeAdmission?._id,
      summary: req.body.summary,
      dischargeNotes: req.body.dischargeNotes,
      dischargedBy: req.user._id,
    });

    res.status(201).json(discharge);
  } catch (error) {
    next(error);
  }
};

export const getAdmissions = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const list = await Admission.find(filter)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .sort({ admittedAt: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getStaffOverview = async (req, res, next) => {
  try {
    const [doctors, staff] = await Promise.all([
      Doctor.find().populate('user', 'name email').sort({ createdAt: -1 }),
      User.find({ role: { $in: ['staff', 'admin'] } }).select('name email role createdAt'),
    ]);
    res.json({
      doctors: doctors.map((d) => ({
        doctorId: d.doctorId,
        name: d.user?.name,
        email: d.user?.email,
        department: d.department || d.specialization,
        available: d.available,
      })),
      staff,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientsOverview = async (req, res, next) => {
  try {
    const [admitted, recentVisits, discharged] = await Promise.all([
      Admission.find({ status: 'active' }).populate({
        path: 'patient',
        populate: { path: 'user', select: 'name' },
      }),
      HospitalVisit.find().sort({ checkIn: -1 }).limit(20).populate({
        path: 'patient',
        populate: { path: 'user', select: 'name' },
      }),
      Discharge.find().sort({ dischargedAt: -1 }).limit(10).populate({
        path: 'patient',
        populate: { path: 'user', select: 'name' },
      }),
    ]);

    res.json({ admitted, recentVisits, discharged });
  } catch (error) {
    next(error);
  }
};
