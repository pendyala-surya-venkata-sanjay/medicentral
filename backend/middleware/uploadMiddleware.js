import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../uploads');

['audio', 'surgery', 'invoices', 'documents', 'patient-docs'].forEach((dir) => {
  const p = path.join(uploadsRoot, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const mime = file.mimetype || '';
    let sub = 'documents';
    if (mime.startsWith('audio/')) sub = 'audio';
    else if (mime.startsWith('image/')) sub = 'surgery';
    else if (file.fieldname === 'invoice') sub = 'invoices';
    else if (file.fieldname === 'document' && req.user?.role === 'patient') sub = 'patient-docs';
    cb(null, path.join(uploadsRoot, sub));
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = file.fieldname || 'file';
    cb(null, `${prefix}-${Date.now()}-${safeName}`);
  },
});

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
]);

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const extOk = /\.(jpe?g|png|pdf|mp3|wav|webm|ogg|webp)$/i.test(file.originalname || '');
  if (ALLOWED_MIME.has(mime) || extOk) return cb(null, true);
  cb(new Error('File type not allowed'));
};

export const uploadSingle = (field) =>
  multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024, files: 1 },
    fileFilter,
  }).single(field);

export const uploadMultiple = (field, max = 10) =>
  multer({
    storage,
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024, files: 1 },
    fileFilter,
  }).array(field, max);

export const publicUrl = (file) => {
  if (!file?.path) return null;
  const rel = path.relative(uploadsRoot, file.path).replace(/\\/g, '/');
  return `/uploads/${rel}`;
};

export default uploadSingle('document');
