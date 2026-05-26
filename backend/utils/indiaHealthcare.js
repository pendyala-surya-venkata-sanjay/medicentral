export const INDIAN_DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'ICU',
  'Emergency',
  'Radiology',
  'Pharmacy',
  'Laboratory',
];

export const VISIT_TYPES = ['OP', 'IP'];

export const VISIT_STATUSES = ['waiting', 'consultation', 'completed', 'emergency'];

export const BILL_CATEGORIES = [
  'consultation',
  'pharmacy',
  'lab',
  'surgery',
  'room',
  'procedure',
  'other',
];

export const PAYMENT_METHODS = ['upi', 'cash', 'card', 'insurance', 'netbanking'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const generateTokenNumber = async (HospitalVisit) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await HospitalVisit.countDocuments({ checkIn: { $gte: today } });
  return `T${String(count + 1).padStart(3, '0')}`;
};

export const generateInvoiceNumber = async (Billing) => {
  const year = new Date().getFullYear();
  const count = await Billing.countDocuments();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
};
