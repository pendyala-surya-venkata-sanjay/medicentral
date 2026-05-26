import VoiceNote from '../models/VoiceNote.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';
import { resolvePatientFromRequest, canAccessPatient } from '../utils/mediaAccess.js';

export const uploadVoiceNote = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Audio file is required');
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      res.status(403);
      throw new Error('Doctor profile required');
    }

    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const note = await VoiceNote.create({
      patient: patient._id,
      doctor: doctor._id,
      title: req.body.title || 'Clinical voice note',
      description: req.body.description,
      audioUrl: publicUrl(req.file),
      durationSeconds: Number(req.body.durationSeconds) || undefined,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      category: req.body.category || 'general',
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const getVoiceNotes = async (req, res, next) => {
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

    const notes = await VoiceNote.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    next(error);
  }
};
