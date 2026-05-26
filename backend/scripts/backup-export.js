/**
 * Phase 7 backup hook — exports MongoDB collections metadata + upload manifest.
 * Run: node scripts/backup-export.js
 * Production: schedule via cron / cloud backup service pointing at same collections.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../backups');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const manifest = {
    exportedAt: new Date().toISOString(),
    database: mongoose.connection.name,
    collections: {},
  };

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    manifest.collections[name] = await mongoose.connection.db.collection(name).countDocuments();
  }

  const uploadsRoot = path.join(__dirname, '../uploads');
  manifest.uploads = fs.existsSync(uploadsRoot)
    ? fs.readdirSync(uploadsRoot, { withFileTypes: true }).map((d) => d.name)
    : [];

  const file = path.join(outDir, `manifest-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  console.log(`Backup manifest written: ${file}`);
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
