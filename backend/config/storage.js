/**
 * Upload storage abstraction — local disk today, S3/Cloudinary-ready.
 * Set STORAGE_PROVIDER=s3|cloudinary when wiring production object storage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localRoot = path.join(__dirname, '../uploads');

export const getStorageProvider = () => process.env.STORAGE_PROVIDER || 'local';

export const getPublicUrl = (relativePath) => {
  const base = process.env.PUBLIC_UPLOAD_BASE_URL || '';
  const rel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (base) return `${base.replace(/\/$/, '')}/${rel}`;
  return `/uploads/${rel}`;
};

export const isStorageReady = () => {
  const provider = getStorageProvider();
  if (provider === 'local') {
    try {
      fs.accessSync(localRoot, fs.constants.W_OK);
      return { ok: true, provider };
    } catch {
      return { ok: false, provider, error: 'uploads directory not writable' };
    }
  }
  if (provider === 's3') {
    return {
      ok: !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID),
      provider,
      configured: !!process.env.AWS_S3_BUCKET,
    };
  }
  if (provider === 'cloudinary') {
    return {
      ok: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      provider,
      configured: !!process.env.CLOUDINARY_CLOUD_NAME,
    };
  }
  return { ok: false, provider, error: 'unknown provider' };
};

export default { getStorageProvider, getPublicUrl, isStorageReady };
