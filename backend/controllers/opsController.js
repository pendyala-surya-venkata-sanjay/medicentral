import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import HospitalVisit from '../models/HospitalVisit.js';
import PatientDocument from '../models/PatientDocument.js';
import { generatePatientId, normalizePatientId } from '../utils/idGenerator.js';
import { generateTokenNumber, INDIAN_DEPARTMENTS } from '../utils/indiaHealthcare.js';
import { WorkflowTransitionService } from '../modules/workflows/workflow-transition.service.js';
import { TimelineService } from '../modules/timeline/timeline.service.js';
import { QueueService } from '../modules/queues/queue.service.js';
import { buildPatientCard } from '../utils/patientCard.js';
import { WORKFLOW_STATES } from '../../shared/constants/workflow.js';
import { QUEUE_TYPES } from '../../shared/constants/queues.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';
import PatientPrebook from '../models/platform/PatientPrebook.js';

export const getOpsContext = async (req, res, next) => {
  try {
    res.json({
      user: { name: req.user.name, email: req.user.email, role: req.user.role },
      operationalRole: req.operationalRole,
      tenant: req.tenant,
      branch: req.branch,
      staffId: req.staff?._id,
    });
  } catch (error) {
    next(error);
  }
};

export const searchPatientsQuick = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const normalized = normalizePatientId(q);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const orClauses = [{ patientId: regex }, { contactNumber: regex }];
    if (normalized.startsWith('MC-PT-')) orClauses.unshift({ patientId: normalized });

    const patients = await Patient.find({ $or: orClauses })
      .populate('user', 'name email')
      .limit(10);

    const byName = await User.find({ name: regex, role: 'patient' }).select('_id name');
    const namePatients = byName.length
      ? await Patient.find({ user: { $in: byName.map((u) => u._id) } }).populate('user', 'name email')
      : [];

    const merged = new Map();
    [...patients, ...namePatients].forEach((p) => merged.set(p._id.toString(), p));

    const results = await Promise.all(
      [...merged.values()].map((p) => buildPatientCard(p))
    );
    res.json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Quick visit — minimal fields; optional new patient; auto-forward to PA.
 */
export const createQuickVisit = async (req, res, next) => {
  try {
    const {
      patientId,
      name,
      phone,
      department,
      visitType,
      priority,
      isFollowUp,
      forwardToPa = false,
      forwardToDoctor = true,
      symptomNotes,
      vitals,
    } = req.body;

    let patient = null;
    if (patientId) {
      patient = await Patient.findOne({ patientId: normalizePatientId(patientId) }).populate(
        'user',
        'name email'
      );
      if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
      }
    } else if (name && phone) {
      const existing = await Patient.findOne({ contactNumber: phone.trim() }).populate('user');
      if (existing) {
        patient = existing;
      } else {
        const user = await User.create({
          name: name.trim(),
          email: `quick+${Date.now()}@medicentral.local`,
          password: `temp${Date.now()}`,
          role: 'patient',
        });
        const pid = await generatePatientId();
        patient = await Patient.create({
          user: user._id,
          patientId: pid,
          contactNumber: phone.trim(),
        });
        await patient.populate('user', 'name email');
      }
    } else {
      res.status(400);
      throw new Error('Provide patientId or name + phone');
    }

    const pendingPrebook = await PatientPrebook.findOne({
      patient: patient._id,
      tenant: req.tenant._id,
      status: 'pending',
    });

    const dept =
      pendingPrebook?.department ||
      (INDIAN_DEPARTMENTS.includes(department) ? department : department || 'General Medicine');
    const tokenNumber = await generateTokenNumber(HospitalVisit);
    let pri = priority || 'normal';
    if (pendingPrebook) pri = 'urgent';

    const visit = await HospitalVisit.create({
      patient: patient._id,
      tenant: req.tenant._id,
      branch: req.branch._id,
      visitType: visitType === 'IP' ? 'IP' : 'OP',
      tokenNumber,
      department: dept,
      status: pri === 'critical' ? 'emergency' : 'waiting',
      workflowState: WORKFLOW_STATES.REGISTERED,
      currentQueueType: QUEUE_TYPES.RECEPTION,
      priority: pri,
      isFollowUp: !!isFollowUp,
      symptomNotes,
      isPrebooked: !!pendingPrebook,
      estimatedWaitMinutes: pendingPrebook?.estimatedWaitMinutes ?? null,
      vitals: vitals
        ? {
            bp: vitals.bp,
            pulse: vitals.pulse,
            temperature: vitals.temperature,
            spo2: vitals.spo2,
            glucose: vitals.glucose,
            respiratoryRate: vitals.respiratoryRate,
            recordedAt: new Date(),
          }
        : undefined,
    });

    if (pendingPrebook) {
      pendingPrebook.status = 'checked_in';
      pendingPrebook.linkedVisit = visit._id;
      await pendingPrebook.save();
    }

    await QueueService.enqueueForVisit({
      visit,
      patient,
      tenant: req.tenant,
      branch: req.branch,
      workflowState: WORKFLOW_STATES.REGISTERED,
      priority: pri,
    });

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant: req.tenant,
      branch: req.branch,
      type: 'visit',
      title: 'Visit created at reception',
      summary: `Token ${tokenNumber} · ${dept}`,
      sourceRef: visit._id,
      sourceModel: 'HospitalVisit',
    });

    let result = { visit, patient: await buildPatientCard(patient, visit) };

    if (forwardToDoctor) {
      const transitioned = await WorkflowTransitionService.transition({
        visitId: visit._id,
        action: 'forward_to_doctor',
        req,
        operationalRole: req.operationalRole,
      });
      result = { ...result, transition: transitioned.transition, visit: transitioned.visit };
    } else if (forwardToPa) {
      const transitioned = await WorkflowTransitionService.transition({
        visitId: visit._id,
        action: 'forward_to_pa',
        req,
        operationalRole: req.operationalRole,
      });
      result = { ...result, transition: transitioned.transition, visit: transitioned.visit };
    }

    res.status(201).json(result);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const updateVisitPrep = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const { paPrepNotes, symptomNotes, vitals, consultationNotes, diagnosisSummary } = req.body;
    if (paPrepNotes !== undefined) visit.paPrepNotes = paPrepNotes;
    if (symptomNotes !== undefined) visit.symptomNotes = symptomNotes;
    if (consultationNotes !== undefined) visit.consultationNotes = consultationNotes;
    if (diagnosisSummary !== undefined) visit.diagnosisSummary = diagnosisSummary;
    if (vitals) visit.vitals = { ...visit.vitals?.toObject?.() || visit.vitals, ...vitals };
    await visit.save();

    if (paPrepNotes || symptomNotes) {
      await TimelineService.appendEvent({
        patient: visit.patient,
        visit,
        tenant: req.tenant,
        branch: req.branch,
        type: 'workflow',
        title: 'PA preparation notes updated',
        summary: paPrepNotes || symptomNotes,
        sourceRef: visit._id,
        sourceModel: 'HospitalVisit',
      });
    }

    const card = await buildPatientCard(visit.patient, visit);
    res.json({ visit, patient: card });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const uploadVisitDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('File required');
    }
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const patient = visit.patient;

    const doc = await PatientDocument.create({
      patient: patient._id,
      uploadedBy: req.user._id,
      category: req.body.category || 'other',
      title: req.body.title || req.file.originalname,
      fileUrl: publicUrl(req.file),
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      source: 'staff',
    });

    await TimelineService.appendEvent({
      patient,
      visit,
      tenant: req.tenant,
      branch: req.branch,
      type: 'patient_upload',
      title: `Report uploaded — ${doc.title}`,
      summary: 'Prepared by PA',
      payload: { documentId: doc._id },
      sourceRef: doc._id,
      sourceModel: 'PatientDocument',
    });

    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

export const getVisitPatientCard = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const documents = await PatientDocument.find({ patient: visit.patient._id })
      .sort({ createdAt: -1 })
      .limit(20);
    const card = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(
      visit,
      req.operationalRole
    );
    res.json({ patient: card, documents, availableActions: actions });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const requestAdmission = async (req, res, next) => {
  try {
    const { admissionType, wardName, emergency, labInstructions } = req.body;
    const result = await WorkflowTransitionService.transition({
      visitId: req.params.visitId,
      action: 'request_admission',
      notes: req.body.notes,
      meta: {
        admissionType: emergency ? 'emergency' : admissionType || 'planned',
        wardName,
        emergency: !!emergency,
        labInstructions,
      },
      req,
      operationalRole: req.operationalRole,
    });
    res.json(result);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const orderLabTests = async (req, res, next) => {
  try {
    const { tests, labInstructions } = req.body;
    const result = await WorkflowTransitionService.transition({
      visitId: req.params.visitId,
      action: 'order_lab',
      notes: labInstructions,
      meta: { tests: tests || [], labInstructions },
      req,
      operationalRole: req.operationalRole,
    });
    res.json(result);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const listHospitalDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({
      tenant: req.tenant._id,
      branch: req.branch._id,
      available: { $ne: false },
    })
      .populate({ path: 'user', select: 'name email' })
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      doctors.map((d) => ({
        doctorId: d.doctorId,
        name: d.user?.name,
        email: d.user?.email,
        specialization: d.specialization,
        department: d.department,
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const listDoctorScopedQueue = async (req, res, next) => {
  try {
    const doctorId = (req.query.doctorId || '').trim();
    if (!doctorId) {
      res.status(400);
      throw new Error('doctorId is required');
    }

    const doctor = await Doctor.findOne({
      doctorId,
      tenant: req.tenant._id,
      branch: req.branch._id,
    }).populate('user', 'name');
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found for this hospital branch');
    }

    const visits = await HospitalVisit.find({
      tenant: req.tenant._id,
      branch: req.branch._id,
      workflowState: {
        $in: [WORKFLOW_STATES.WAITING_FOR_DOCTOR, WORKFLOW_STATES.IN_CONSULTATION],
      },
      $or: [{ assignedDoctor: doctor._id }, { assignedDoctor: null }],
    })
      .populate('patient')
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .sort({ priority: -1, checkIn: 1 })
      .limit(50);

    const cards = await Promise.all(visits.map((v) => buildPatientCard(v.patient, v)));
    res.json({
      doctor: {
        doctorId: doctor.doctorId,
        name: doctor.user?.name,
        specialization: doctor.specialization,
      },
      patients: cards,
    });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const listPendingPrebooks = async (req, res, next) => {
  try {
    const prebooks = await PatientPrebook.find({
      tenant: req.tenant._id,
      branch: req.branch._id,
      status: 'pending',
    })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .sort({ scheduledAt: 1 })
      .lean();

    const rows = await Promise.all(
      prebooks.map(async (pb) => {
        const patient = pb.patient;
        const card = patient ? await buildPatientCard(patient) : null;
        return {
          _id: pb._id,
          department: pb.department,
          scheduledAt: pb.scheduledAt,
          notes: pb.notes,
          patientId: card?.patientId,
          patientName: card?.name || patient?.user?.name,
        };
      })
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const checkInPrebookToDoctorQueue = async (req, res, next) => {
  try {
    const prebook = await PatientPrebook.findOne({
      _id: req.params.prebookId,
      tenant: req.tenant._id,
      status: 'pending',
    }).populate('patient');
    if (!prebook?.patient) {
      res.status(404);
      throw new Error('Pre-booking not found');
    }
    const patient = await Patient.findById(prebook.patient._id).populate('user', 'name email');
    req.body = {
      patientId: patient.patientId,
      department: prebook.department,
      visitType: 'OP',
      priority: 'urgent',
      forwardToDoctor: true,
      symptomNotes: prebook.notes,
    };
    return createQuickVisit(req, res, next);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const listWardAdmittedPatients = async (req, res, next) => {
  try {
    const visits = await HospitalVisit.find({
      tenant: req.tenant._id,
      branch: req.branch._id,
      workflowState: {
        $in: [
          WORKFLOW_STATES.ADMISSION_REQUIRED,
          WORKFLOW_STATES.ADMITTED,
          WORKFLOW_STATES.UNDER_OBSERVATION,
        ],
      },
    })
      .populate('patient')
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .sort({ 'inpatient.admittedAt': -1, checkIn: -1 })
      .limit(50);

    const cards = await Promise.all(visits.map((v) => buildPatientCard(v.patient, v)));
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

export const listFollowUpPatients = async (req, res, next) => {
  try {
    const visits = await HospitalVisit.find({
      tenant: req.tenant._id,
      branch: req.branch._id,
      hasDoctorPrescription: true,
      $or: [
        { followUpRequired: true },
        { dischargeRequested: true },
        {
          workflowState: {
            $in: [
              WORKFLOW_STATES.BILLING_PENDING,
              WORKFLOW_STATES.PAYMENT_COMPLETED,
              WORKFLOW_STATES.READY_FOR_DISCHARGE,
            ],
          },
        },
      ],
    })
      .populate('patient')
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .sort({ checkIn: -1 })
      .limit(40);

    const cards = await Promise.all(visits.map((v) => buildPatientCard(v.patient, v)));
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

export const lookupPatientById = async (req, res, next) => {
  try {
    const patientId = normalizePatientId((req.query.patientId || '').trim());
    if (!patientId) {
      res.status(400);
      throw new Error('patientId is required');
    }
    const patient = await Patient.findOne({ patientId }).populate('user', 'name email');
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    const activeVisit = await HospitalVisit.findOne({
      patient: patient._id,
      tenant: req.tenant._id,
      timelineOpen: { $ne: false },
      workflowState: { $ne: WORKFLOW_STATES.DISCHARGED },
    })
      .sort({ checkIn: -1 })
      .populate('tenant branch');

    // Privacy gate: while the patient is under doctor, do NOT reveal history to non-doctor staff.
    const underDoctor =
      activeVisit &&
      [WORKFLOW_STATES.WAITING_FOR_DOCTOR, WORKFLOW_STATES.IN_CONSULTATION].includes(
        activeVisit.workflowState
      ) &&
      !activeVisit.hasDoctorPrescription;

    if (underDoctor && req.operationalRole !== 'doctor') {
      return res.json({
        patient: { patientId: patient.patientId, name: patient.user?.name || 'Patient' },
        visit: {
          _id: activeVisit._id,
          workflowState: activeVisit.workflowState,
          tokenNumber: activeVisit.tokenNumber,
          department: activeVisit.department,
        },
        restricted: true,
        message: 'Patient is currently with doctor. Details will unlock after doctor submits prescription.',
      });
    }

    const card = await buildPatientCard(patient, activeVisit);
    const actions = activeVisit
      ? WorkflowTransitionService.getAvailableForVisit(activeVisit, req.operationalRole)
      : [];
    res.json({ patient: card, visit: activeVisit, availableActions: actions, restricted: false });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const getDoctorPatientContext = async (req, res, next) => {
  try {
    const visit = await WorkflowTransitionService.loadVisit(req.params.visitId);
    const card = await buildPatientCard(visit.patient, visit);
    const actions = WorkflowTransitionService.getAvailableForVisit(
      visit,
      req.operationalRole
    );

    const doctor = await Doctor.findOne({ user: req.user._id });

    res.json({
      patient: card,
      visit,
      availableActions: actions,
      doctorId: doctor?.doctorId,
    });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};
