/**
 * Full database reset — run: npm run reset
 * Clears all application data; preserves MongoDB collections/schemas.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const COLLECTIONS = [
  'users',
  'patients',
  'doctors',
  'hospitals',
  'medicalrecords',
  'predictions',
  'prescriptions',
  'voicenotes',
  'surgerymedias',
  'billings',
  'payments',
  'hospitalvisits',
  'admissions',
  'discharges',
  'labreports',
  'auditlogs',
  'patientdocuments',
  'staffs',
  'hospitaltenants',
  'branches',
  'queueitems',
];

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const results = {};

  for (const name of COLLECTIONS) {
    try {
      const col = db.collection(name);
      const r = await col.deleteMany({});
      results[name] = r.deletedCount;
    } catch {
      results[name] = 0;
    }
  }

  console.log('Database reset complete:');
  console.log(JSON.stringify(results, null, 2));
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
