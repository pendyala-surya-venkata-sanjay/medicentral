from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import predict_disease
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MediCentral ML Service", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomInput(BaseModel):
    symptoms: list[str]

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "MediCentral ML Prediction Engine"}

@app.post("/predict")
def predict(input_data: SymptomInput):
    if not input_data.symptoms or len(input_data.symptoms) == 0:
        raise HTTPException(status_code=400, detail="Symptoms list cannot be empty")
    
    # Process symptoms to lowercase and strip whitespace
    clean_symptoms = [s.strip().lower() for s in input_data.symptoms]
    
    prediction = predict_disease(clean_symptoms)
    return prediction

from fastapi import File, UploadFile
import pytesseract
from PIL import Image
import io

@app.post("/ocr")
async def extract_prescription_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Run Tesseract OCR on the image
        extracted_text = pytesseract.image_to_string(image)
        
        # Simple extraction logic (can be improved with NLP later)
        return {
            "status": "success",
            "raw_text": extracted_text,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
