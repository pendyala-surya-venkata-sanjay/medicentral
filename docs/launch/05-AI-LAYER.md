# AI Layer Overview

MediCentral uses **assistive AI** — not autonomous diagnosis.

## Capabilities

| Feature | Nature |
|---------|--------|
| Symptom Assistant | Rules-based matcher + disclaimer (patient-only route) |
| Visit summaries | Template + context aggregation for doctors |
| Command Center narrative | Network health score + human-readable insight |
| OCR | Tesseract via ML service for document ingestion |

## Honest positioning

- Symptom output is **prototype / educational** — clearly labeled in UI.
- Clinical decisions remain with licensed staff.
- Future: optional LLM provider behind same consent and audit boundaries.

## Ops value

AI reduces **coordination friction** (summaries, queue prioritization hints, ecosystem narrative) rather than replacing clinicians.
