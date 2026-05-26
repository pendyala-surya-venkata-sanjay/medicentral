import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { resolvePatientFromRequest, canAccessPatient } from '../utils/mediaAccess.js';
import { TimelineService } from '../modules/timeline/timeline.service.js';
import HospitalVisit from '../models/HospitalVisit.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AUDIT_ACTIONS } from '../modules/audit/audit.actions.js';
import { parseDurationDays } from '../utils/parseDurationDays.js';
import { WORKFLOW_STATES } from '../../shared/constants/workflow.js';

const normalizeMedicines = (medicines = []) =>
  medicines.map((m) => {
    const durationDays = Number(m.durationDays) || parseDurationDays(m.duration) || undefined;
    return {
      ...m,
      durationDays,
      duration: m.duration || (durationDays ? `${durationDays} day${durationDays > 1 ? 's' : ''}` : ''),
    };
  });

const getDoctorContext = async (user) => {
  const doctor = await Doctor.findOne({ user: user._id });
  if (!doctor) {
    const err = new Error('Doctor profile not found');
    err.status = 403;
    throw err;
  }
  const doctorUser = await User.findById(user._id);
  return { doctor, doctorName: doctorUser.name };
};

export const createPrescription = async (req, res, next) => {
  try {
    const { patientId, symptoms, diagnosis, medicines, clinicalNotes, notes, followUpDate } =
      req.body;
    const { doctor, doctorName } = await getDoctorContext(req.user);
    const patient = await Patient.findOne({ patientId }).populate('user', 'name');
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const rawMeds = typeof medicines === 'string' ? JSON.parse(medicines || '[]') : medicines || [];
    const parsedMeds = normalizeMedicines(rawMeds);
    const symptomList = Array.isArray(symptoms)
      ? symptoms
      : typeof symptoms === 'string'
        ? symptoms.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    const activeVisit = await HospitalVisit.findOne({
      patient: patient._id,
      workflowState: { $ne: WORKFLOW_STATES.DISCHARGED },
      timelineOpen: { $ne: false },
    })
      .sort({ checkIn: -1 })
      .populate('tenant branch');

    const rx = await Prescription.create({
      patient: patient._id,
      doctor: doctor._id,
      visit: activeVisit?._id,
      patientName: patient.user?.name || req.body.patientName || 'Patient',
      doctorName,
      symptoms: symptomList,
      diagnosis,
      medicines: parsedMeds,
      clinicalNotes,
      notes,
      followUpDate: followUpDate || undefined,
    });

    await TimelineService.appendEvent({
      patient,
      visit: activeVisit,
      tenant: activeVisit?.tenant,
      branch: activeVisit?.branch,
      type: 'prescription',
      title: `Prescription — ${diagnosis}`,
      summary: `${parsedMeds.length} medicine(s) · ${parsedMeds.map((m) => m.medicine).join(', ')}`,
      payload: {
        medicines: parsedMeds.map((m) => ({
          medicine: m.medicine,
          durationDays: m.durationDays,
        })),
      },
      sourceRef: rx._id,
      sourceModel: 'Prescription',
    }).catch(() => {});

    // This is the moment staff can proceed (follow-up/billing/discharge).
    if (activeVisit?._id) {
      await HospitalVisit.updateOne(
        { _id: activeVisit._id },
        { $set: { hasDoctorPrescription: true, doctorSubmittedAt: new Date() } }
      ).catch(() => {});
    }

    await AuditService.record({
      req,
      action: AUDIT_ACTIONS.PRESCRIPTION_CREATE,
      entity: 'prescription',
      entityId: rx._id,
      after: { patientId, diagnosis, medicineCount: parsedMeds.length },
    });

    res.status(201).json(rx);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const patient = await resolvePatientFromRequest(req.user, req.params.patientId);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    if (!(await canAccessPatient(req.user, patient._id))) {
      res.status(403);
      throw new Error('Not authorized');
    }

    const list = await Prescription.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req, res, next) => {
  try {
    const { doctor } = await getDoctorContext(req.user);
    const rx = await Prescription.findById(req.params.id);
    if (!rx || rx.doctor.toString() !== doctor._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this prescription');
    }

    const allowed = ['symptoms', 'diagnosis', 'medicines', 'clinicalNotes', 'notes', 'followUpDate'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) rx[key] = req.body[key];
    });
    await rx.save();
    res.json(rx);
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};

export const deletePrescription = async (req, res, next) => {
  try {
    const { doctor } = await getDoctorContext(req.user);
    const rx = await Prescription.findById(req.params.id);
    if (!rx || rx.doctor.toString() !== doctor._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    await rx.deleteOne();
    res.json({ message: 'Prescription removed' });
  } catch (error) {
    if (error.status) res.status(error.status);
    next(error);
  }
};
