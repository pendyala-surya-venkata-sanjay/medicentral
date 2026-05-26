import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import HospitalVisit from '../models/HospitalVisit.js';
import Billing from '../models/Billing.js';
import LabReport from '../models/LabReport.js';
import { generateTokenNumber } from './indiaHealthcare.js';

const DEMO_USERS = [
  { name: 'Rahul Sharma', email: 'patient@demo.com', password: 'demo123', role: 'patient' },
  { name: 'Dr. Priya Nair', email: 'doctor@demo.com', password: 'demo123', role: 'doctor' },
  { name: 'Hospital Admin', email: 'staff@demo.com', password: 'demo123', role: 'staff' },
];

export const ensureDemoDataSeeded = async () => {
  const existingDemo = await User.findOne({ email: 'patient@demo.com' });
  if (existingDemo) {
    return { seeded: false, message: 'Demo data already exists' };
  }

  const users = [];
  for (const u of DEMO_USERS) {
    const user = await User.create(u);
    users.push(user);
  }

  const [patientUser, doctorUser, staffUser] = users;

  const patient = await Patient.create({
    user: patientUser._id,
    patientId: 'MC-PT-1001',
    age: 32,
    gender: 'Male',
    bloodGroup: 'B+',
    contactNumber: '9876543210',
    aadhaarLast4: '4521',
    address: { line1: '12 MG Road', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001' },
    emergencyContact: { name: 'Anita Sharma', phone: '9876500000', relation: 'Spouse' },
    allergies: ['Penicillin'],
    ongoingMedications: ['Vitamin D3'],
  });

  const doctor = await Doctor.create({
    user: doctorUser._id,
    doctorId: 'MC-DR-2001',
    specialization: 'General Medicine',
    department: 'General Medicine',
    consultationFee: 500,
    qualification: 'MBBS, MD',
  });

  await MedicalRecord.create({
    patient: patient._id,
    doctor: doctor._id,
    diagnosis: 'Seasonal viral fever',
    symptoms: ['fever', 'body ache', 'fatigue'],
    prescriptions: [{ medicine: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '5 days' }],
    doctorNotes: 'Adequate rest and hydration advised.',
    dateOfVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  });

  await Prescription.create({
    patient: patient._id,
    doctor: doctor._id,
    patientName: patientUser.name,
    doctorName: doctorUser.name,
    symptoms: ['fever', 'cough'],
    diagnosis: 'Upper respiratory tract infection',
    medicines: [
      { medicine: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '5 days', timing: 'After meals' },
    ],
    clinicalNotes: '<p>Patient stable. Monitor symptoms.</p>',
    followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  const tokenNumber = await generateTokenNumber(HospitalVisit);
  await HospitalVisit.create({
    patient: patient._id,
    visitType: 'OP',
    tokenNumber,
    department: 'General Medicine',
    status: 'completed',
    checkIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    checkOut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
  });

  await Billing.create({
    patient: patient._id,
    invoiceNumber: 'INV-2026-00001',
    items: [{ description: 'OP consultation', amount: 500, category: 'consultation' }],
    subtotal: 500,
    gstAmount: 0,
    totalAmount: 500,
    amountPaid: 500,
    status: 'paid',
    payments: [{ amount: 500, method: 'upi', reference: 'UPI-DEMO', paidAt: new Date() }],
    createdBy: staffUser._id,
  });

  await LabReport.create({
    patient: patient._id,
    doctor: doctor._id,
    testName: 'Complete Blood Count (CBC)',
    category: 'pathology',
    result: 'Within normal limits',
    status: 'completed',
    completedAt: new Date(),
  });

  return {
    seeded: true,
    demoAccounts: DEMO_USERS.map((u) => ({ email: u.email, password: u.password, role: u.role })),
    patientId: 'MC-PT-1001',
  };
};
