import axios from 'axios';
import Prediction from '../models/Prediction.js';
import { fallbackPredict } from '../utils/predictionFallback.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const formatPredictionResponse = (record) => ({
  id: record._id,
  disease: record.predictedDisease,
  confidence: record.confidenceScore,
  severity: record.severity,
  specialist: record.specialistSuggested,
  precautions: record.precautions || [],
  symptoms: record.symptoms,
  createdAt: record.createdAt,
  disclaimer:
    'Prototype symptom assistant — not medical advice. Consult a licensed healthcare professional.',
});

export const predictDisease = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    let mlData;

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, { symptoms }, { timeout: 8000 });
      mlData = mlResponse.data;
    } catch (mlError) {
      console.warn('ML service unavailable, using rules fallback:', mlError.message);
      mlData = fallbackPredict(symptoms);
    }

    const { disease, confidence, severity, specialistSuggested, precautions } = mlData;
    const specialist = specialistSuggested || mlData.specialist;

    const predictionRecord = await Prediction.create({
      user: req.user._id,
      symptoms,
      predictedDisease: disease,
      confidenceScore: confidence,
      severity,
      specialistSuggested: specialist,
      precautions: precautions || [],
    });

    res.status(200).json({
      ...formatPredictionResponse(predictionRecord),
      urgency: mlData.urgency,
      relatedConditions: mlData.relatedConditions || [],
      analysisSteps: mlData.analysisSteps || [],
      symptomInsights: mlData.symptomInsights || [],
      disclaimer:
        mlData.disclaimer ||
        'Educational triage assistant only — not medical advice. Consult a licensed healthcare professional.',
    });
  } catch (error) {
    next(error);
  }
};

export const getPredictionHistory = async (req, res, next) => {
  try {
    const history = await Prediction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(history.map(formatPredictionResponse));
  } catch (error) {
    next(error);
  }
};
