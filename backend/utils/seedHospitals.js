import Hospital from '../models/Hospital.js';

export const HOSPITAL_SEED_DATA = [
  {
    name: 'City General Hospital',
    address: '123 Main St',
    city: 'Metropolis',
    state: 'NY',
    zipCode: '10001',
    contactNumber: '555-0101',
    emergencyNumber: '911',
    facilities: ['ICU', 'Emergency Care', 'Surgery', 'Pediatrics'],
    location: { lat: 40.7128, lng: -74.006 },
    rating: 4.5,
  },
  {
    name: 'Mercy Care Center',
    address: '456 Oak Avenue',
    city: 'Metropolis',
    state: 'NY',
    zipCode: '10002',
    contactNumber: '555-0202',
    emergencyNumber: '555-9999',
    facilities: ['Cardiology', 'Neurology', 'Outpatient'],
    location: { lat: 40.7328, lng: -73.996 },
    rating: 4.8,
  },
  {
    name: 'Sunrise Medical Institute',
    address: '789 Pine Road',
    city: 'Gotham',
    state: 'NJ',
    zipCode: '07001',
    contactNumber: '555-0303',
    emergencyNumber: '911',
    facilities: ['Emergency Care', 'Oncology', 'Maternity'],
    location: { lat: 40.7282, lng: -74.0776 },
    rating: 4.2,
  },
];

export const ensureHospitalsSeeded = async () => {
  const count = await Hospital.countDocuments();
  if (count > 0) return { seeded: false, count };

  const created = await Hospital.insertMany(HOSPITAL_SEED_DATA);
  return { seeded: true, count: created.length };
};
