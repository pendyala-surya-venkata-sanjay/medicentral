import express from 'express';
import { getUpload } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:folder/:filename', protect, (req, res, next) => {
  req.params[0] = `${req.params.folder}/${req.params.filename}`;
  getUpload(req, res, next);
});
router.get('/:filename', protect, (req, res, next) => {
  req.params[0] = req.params.filename;
  getUpload(req, res, next);
});

export default router;
