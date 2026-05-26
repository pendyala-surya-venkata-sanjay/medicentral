import LabReport from '../models/LabReport.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { resolvePatientFromRequest, canAccessPatient } from '../utils/mediaAccess.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';

export const createLabReport = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    let doctor = null;
    if (req.user.role === 'doctor') {
      doctor = await Doctor.findOne({ user: req.user._id });
    }

    const report = await LabReport.create({
      patient: patient._id,
      doctor: doctor?._id,
      testName: req.body.testName,
      category: req.body.category || 'pathology',
      result: req.body.result,
      normalRange: req.body.normalRange,
      status: req.body.status || 'completed',
      reportUrl: req.file ? publicUrl(req.file) : undefined,
      notes: req.body.notes,
      completedAt: req.body.status === 'completed' ? new Date() : undefined,
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getLabReports = async (req, res, next) => {
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

    const reports = await LabReport.find({ patient: patient._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};
