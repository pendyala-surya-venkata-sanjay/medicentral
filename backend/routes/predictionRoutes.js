import express from 'express';
import { predictDisease, getPredictionHistory } from '../controllers/predictionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validatePrediction } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/predict', protect, validatePrediction, predictDisease);
router.get('/history', protect, getPredictionHistory);

export default router;
