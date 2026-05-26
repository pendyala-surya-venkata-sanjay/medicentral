import SurgeryMedia from '../models/SurgeryMedia.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';
import { resolvePatientFromRequest, canAccessPatient } from '../utils/mediaAccess.js';

export const uploadSurgeryMedia = async (req, res, next) => {
  try {
    const files = req.files?.length ? req.files : req.file ? [req.file] : [];
    if (!files.length) {
      res.status(400);
      throw new Error('At least one image is required');
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor && !['staff', 'admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Doctor or hospital staff access required');
    }

    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const created = await Promise.all(
      files.map((file, idx) =>
        SurgeryMedia.create({
          patient: patient._id,
          doctor: doctor?._id,
          uploadedBy: req.user._id,
          title: req.body.title || `Surgery image ${idx + 1}`,
          caption: req.body.caption,
          mediaUrl: publicUrl(file),
          mediaType: 'image',
          visitDate: req.body.visitDate || Date.now(),
        })
      )
    );

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const getSurgeryGallery = async (req, res, next) => {
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

    const gallery = await SurgeryMedia.find({ patient: patient._id }).sort({ visitDate: -1 });
    res.json(gallery);
  } catch (error) {
    next(error);
  }
};
