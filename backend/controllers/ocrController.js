import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// @desc    Process prescription image through OCR
// @route   POST /api/ocr/scan
// @access  Private (Doctor)
export const scanPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No image file provided for OCR scanning.');
    }

    // Prepare form-data to forward the file to the ML service
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), req.file.filename);

    // Call the Python FastAPI OCR endpoint
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/ocr`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // We successfully got the text.
    // Optionally delete the file from the Node backend if we don't want to store it yet.
    // fs.unlinkSync(req.file.path); 

    res.status(200).json(mlResponse.data);

  } catch (error) {
    console.error('OCR Service Error:', error.message);
    if (error.response) {
       console.error('ML Data:', error.response.data);
    }
    res.status(503);
    next(new Error('OCR Service is currently unavailable or failed to process the image.'));
  }
};
