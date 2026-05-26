import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';
import { normalizePatientId } from '../utils/idGenerator.js';

const parsePrescriptions = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// @desc    Create a new medical record
// @route   POST /api/records/create
// @access  Private/Doctor
export const createRecord = async (req, res, next) => {
  try {
    const { patientId, diagnosis, symptoms, prescriptions, notes } = req.body;

    if (!diagnosis?.trim()) {
      res.status(400);
      throw new Error('Diagnosis is required');
    }

    const patient = await Patient.findOne({ patientId: normalizePatientId(patientId) });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      res.status(403);
      throw new Error('Doctor profile not found');
    }

    const labReports = [];
    if (req.file) {
      labReports.push({
        testName: req.file.originalname || 'Uploaded Document',
        reportUrl: publicUrl(req.file),
        date: Date.now(),
      });
    }

    const record = await MedicalRecord.create({
      patient: patient._id,
      doctor: doctor._id,
      diagnosis: diagnosis.trim(),
      symptoms: symptoms ? symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
      prescriptions: parsePrescriptions(prescriptions),
      doctorNotes: notes,
      labReports,
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient records
// @route   GET /api/records/patient/:id?
// @access  Private
export const getPatientRecords = async (req, res, next) => {
  try {
    let patientObjId;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      if (!patient) {
        res.status(404);
        throw new Error('Patient profile not found');
      }
      patientObjId = patient._id;
    } else {
      const id = normalizePatientId(req.params.id);
      if (!id) {
        res.status(400);
        throw new Error('Patient ID is required');
      }
      const patient = await Patient.findOne({ patientId: id });
      if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
      }
      patientObjId = patient._id;
    }

    const records = await MedicalRecord.find({ patient: patientObjId })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .sort({ dateOfVisit: -1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a medical record
// @route   PUT /api/records/update/:id
// @access  Private/Doctor
export const updateRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Record not found');
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || record.doctor.toString() !== doctor._id.toString()) {
      res.status(403);
      throw new Error('You can only update your own created records');
    }

    const updates = {};
    if (req.body.diagnosis !== undefined) updates.diagnosis = req.body.diagnosis;
    if (req.body.symptoms !== undefined) {
      updates.symptoms = Array.isArray(req.body.symptoms)
        ? req.body.symptoms
        : req.body.symptoms.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (req.body.prescriptions !== undefined) {
      updates.prescriptions = parsePrescriptions(req.body.prescriptions);
    }
    if (req.body.doctorNotes !== undefined) updates.doctorNotes = req.body.doctorNotes;
    if (req.body.followUp !== undefined) updates.followUp = req.body.followUp;

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(updatedRecord);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a medical record
// @route   DELETE /api/records/delete/:id
// @access  Private/Doctor
export const deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Record not found');
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || record.doctor.toString() !== doctor._id.toString()) {
      res.status(403);
      throw new Error('You can only delete your own created records');
    }

    await record.deleteOne();
    res.json({ message: 'Record removed' });
  } catch (error) {
    next(error);
  }
};
