/**
 * Heuristic document ingestion — LLM/OCR-ready placeholder layer.
 */
const TYPE_PATTERNS = [
  { type: 'lab_report', pattern: /lab|cbc|pathology|mri|ct|x-?ray|blood/i },
  { type: 'prescription', pattern: /rx|prescription|medicine|tablet/i },
  { type: 'imaging', pattern: /scan|imaging|ultrasound|echo/i },
  { type: 'discharge_summary', pattern: /discharge|summary/i },
  { type: 'insurance', pattern: /insurance|claim|tpa|policy/i },
  { type: 'pathology', pattern: /biopsy|histology/i },
];

const MED_PATTERNS = /\b(paracetamol|metformin|aspirin|amoxicillin|insulin|atorvastatin|omeprazole)\b/gi;
const TEST_PATTERNS = /\b(CBC|HbA1c|MRI|CT|X-Ray|lipid|thyroid|TSH|creatinine)\b/gi;

export class DocumentIntelligenceService {
  static analyze({ fileName, mimeType, category, title, description, ocrText = '' }) {
    const blob = `${fileName || ''} ${title || ''} ${description || ''} ${ocrText || ''} ${category || ''}`;
    let documentType = category || 'unknown';
    for (const { type, pattern } of TYPE_PATTERNS) {
      if (pattern.test(blob)) {
        documentType = type;
        break;
      }
    }

    const medicines = [...new Set((blob.match(MED_PATTERNS) || []).map((m) => m.toLowerCase()))];
    const tests = [...new Set((blob.match(TEST_PATTERNS) || []).map((t) => t.toUpperCase()))];

    const tags = [documentType];
    if (medicines.length) tags.push('medications');
    if (tests.length) tags.push('diagnostics');
    if (/urgent|critical/i.test(blob)) tags.push('urgent');

    return {
      source: 'heuristic',
      llmReady: true,
      documentType,
      detectedMedicines: medicines,
      detectedTests: tests,
      tags,
      suggestedCategory: documentType === 'unknown' ? category || 'other' : documentType,
      confidence: 'heuristic',
      extractionNote: 'Placeholder extraction — connect ML OCR service for production parsing',
    };
  }
}

export default DocumentIntelligenceService;
