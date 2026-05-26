import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { canAccessMediaFile } from '../utils/mediaAccess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// @desc    Securely serve uploaded files (documents, audio, surgery, invoices)
// @route   GET /api/uploads/*
// @access  Private
export const getUpload = async (req, res, next) => {
  try {
    const filePath = req.params[0];
    if (!filePath || filePath.includes('..')) {
      res.status(400);
      throw new Error('Invalid file path');
    }

    const fullPath = path.join(uploadsDir, filePath);
    if (!fs.existsSync(fullPath)) {
      res.status(404);
      throw new Error('File not found');
    }

    const filename = filePath.replace(/\\/g, '/').split('/').pop();
    const allowed = await canAccessMediaFile(req.user, filename);
    if (!allowed) {
      const allowedPath = await canAccessMediaFile(req.user, filePath);
      if (!allowedPath) {
        res.status(403);
        throw new Error('Not authorized to access this file');
      }
    }

    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
};
