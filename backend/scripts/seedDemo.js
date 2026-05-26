/**
 * Full demo seed — run: npm run seed
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import { ensureDemoDataSeeded } from '../utils/seedDemoData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  await connectDB();
  const result = await ensureDemoDataSeeded();
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
