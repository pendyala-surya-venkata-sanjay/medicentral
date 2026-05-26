import PatientDocument from '../models/PatientDocument.js';
import Patient from '../models/Patient.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';
import { resolvePatientFromRequest, canAccessPatient } from '../utils/mediaAccess.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AUDIT_ACTIONS } from '../modules/audit/audit.actions.js';
import { DocumentIntelligenceService } from '../modules/intelligence/document-intelligence.service.js';

export const uploadPatientDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please select a file to upload');
    }

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    const category = req.body.category || 'other';
    const title =
      req.body.title?.trim() ||
      req.file.originalname?.replace(/\.[^.]+$/, '') ||
      'Medical document';

    const ai = DocumentIntelligenceService.analyze({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      category,
      title,
      description: req.body.description,
    });

    const doc = await PatientDocument.create({
      patient: patient._id,
      uploadedBy: req.user._id,
      category: ai.suggestedCategory !== 'unknown' ? ai.suggestedCategory : category,
      title,
      description: req.body.description,
      fileUrl: publicUrl(req.file),
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      source: 'patient',
      aiExtraction: { ...ai, analyzedAt: new Date() },
    });

    await AuditService.record({
      req,
      action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
      entity: 'patient_document',
      entityId: doc._id,
      after: { category, fileName: doc.fileName },
    });

    res.status(201).json({ ...doc.toObject(), aiExtraction: ai });
  } catch (error) {
    next(error);
  }
};

export const getMyDocuments = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error('Patient profile not found');
    }

    const docs = await PatientDocument.find({ patient: patient._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

export const getPatientDocuments = async (req, res, next) => {
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

    const docs = await PatientDocument.find({ patient: patient._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    next(error);
  }
};

export const deletePatientDocument = async (req, res, next) => {
  try {
    const doc = await PatientDocument.findById(req.params.id);
    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient || doc.patient.toString() !== patient._id.toString()) {
      res.status(403);
      throw new Error('You can only delete your own uploads');
    }

    await doc.deleteOne();
    res.json({ message: 'Document removed' });
  } catch (error) {
    next(error);
  }
};
