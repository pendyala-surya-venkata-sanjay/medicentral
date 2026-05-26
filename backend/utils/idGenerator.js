import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

const uniqueId = async (Model, field, prefix) => {
  for (let attempt = 0; attempt < 25; attempt++) {
    const num = String(Math.floor(1000 + Math.random() * 9000));
    const id = `${prefix}-${num}`;
    const exists = await Model.exists({ [field]: id });
    if (!exists) return id;
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
};

export const generatePatientId = () => uniqueId(Patient, 'patientId', 'MC-PT');
export const generateDoctorId = () => uniqueId(Doctor, 'doctorId', 'MC-DR');

export const normalizePatientId = (raw) => {
  const input = String(raw || '').trim();
  if (!input) return '';

  const embedded = input.match(/MC-PT-\d{4,}/i);
  if (embedded) return embedded[0].toUpperCase();

  const s = input.toUpperCase();
  if (s.startsWith('MC-PT-')) return s;
  if (/^\d{4,}$/.test(s)) return `MC-PT-${s}`;
  return s;
};
