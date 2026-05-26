import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { normalizePatientId, generatePatientId } from '../utils/idGenerator.js';

const toPatientPayload = (patient) => ({
  _id: patient._id,
  patientId: patient.patientId,
  name: patient.user?.name,
  email: patient.user?.email,
  age: patient.age,
  gender: patient.gender,
  bloodGroup: patient.bloodGroup,
  contactNumber: patient.contactNumber,
  address: patient.address,
  emergencyContact: patient.emergencyContact,
});

export const getPatientByPatientId = async (req, res, next) => {
  try {
    const patientId = normalizePatientId(req.params.patientId);
    if (!patientId) {
      res.status(400);
      throw new Error('Invalid Patient ID — use format MC-PT-1001');
    }

    let patient = await Patient.findOne({ patientId }).populate('user', 'name email');
    if (!patient) {
      res.status(404);
      throw new Error(`Patient not found with ID ${patientId}`);
    }

    if (!patient.patientId) {
      patient.patientId = await generatePatientId();
      await patient.save();
    }

    res.json({
      success: true,
      patient: toPatientPayload(patient),
      ...toPatientPayload(patient),
    });
  } catch (error) {
    next(error);
  }
};

export const searchPatients = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const normalized = normalizePatientId(q);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const orClauses = [{ patientId: regex }, { contactNumber: regex }, { 'address.city': regex }];
    if (normalized.startsWith('MC-PT-')) orClauses.unshift({ patientId: normalized });
    if (/^\d{4}$/.test(q)) orClauses.push({ aadhaarLast4: q });

    const patients = await Patient.find({ $or: orClauses })
      .populate('user', 'name email')
      .limit(15);

    const byName = await User.find({ name: regex, role: 'patient' }).select('_id name email');
    const nameIds = byName.map((u) => u._id);
    const namePatients = nameIds.length
      ? await Patient.find({ user: { $in: nameIds } }).populate('user', 'name email').limit(15)
      : [];

    const merged = new Map();
    [...patients, ...namePatients].forEach((p) => merged.set(p._id.toString(), p));

    const results = [...merged.values()].map((p) => ({
      _id: p._id,
      patientId: p.patientId,
      name: p.user?.name,
      email: p.user?.email,
      contactNumber: p.contactNumber,
      bloodGroup: p.bloodGroup,
      state: p.address?.state,
    }));

    res.json(results.slice(0, 15));
  } catch (error) {
    next(error);
  }
};
