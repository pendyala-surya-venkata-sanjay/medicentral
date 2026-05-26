/** Clinical-style rules engine when ML service is unavailable (educational use only). */
const RULES = [
  {
    keywords: ['fever', 'cough', 'sore throat', 'body aches', 'fatigue'],
    disease: 'Viral upper respiratory infection',
    specialist: 'General Physician',
    severity: 'Low',
    urgency: 'Schedule OPD within 24–48 hours if symptoms persist.',
    precautions: [
      'Rest, fluids, and paracetamol only as directed on the label.',
      'Isolate if fever is high; wear a mask around vulnerable family members.',
      'Return if breathing becomes difficult or fever lasts beyond 3 days.',
    ],
    related: ['Common cold', 'Influenza-like illness'],
  },
  {
    keywords: ['chest pain', 'difficulty breathing'],
    disease: 'Possible cardiac or respiratory emergency',
    specialist: 'Emergency / Cardiology',
    severity: 'High',
    urgency: 'Seek emergency care immediately — do not wait for telehealth.',
    precautions: [
      'Call local emergency services or go to the nearest emergency department.',
      'Avoid exertion; sit upright if breathless.',
      'Do not self-medicate with aspirin unless already prescribed.',
    ],
    related: ['Angina', 'Pulmonary embolism', 'Severe asthma'],
  },
  {
    keywords: ['headache', 'dizziness', 'confusion'],
    disease: 'Neurological evaluation recommended',
    specialist: 'Neurologist',
    severity: 'Medium',
    urgency: 'Urgent consult if confusion, weakness, or worst headache of life.',
    precautions: [
      'Track headache onset, triggers, and associated vision changes.',
      'Avoid driving if dizzy.',
      'Emergency care if sudden severe headache with neck stiffness.',
    ],
    related: ['Migraine', 'Vertigo', 'Hypertension'],
  },
  {
    keywords: ['nausea', 'vomiting', 'diarrhea'],
    disease: 'Acute gastroenteritis',
    specialist: 'General Physician',
    severity: 'Medium',
    urgency: 'Same-day care if unable to keep fluids down or signs of dehydration.',
    precautions: [
      'Oral rehydration solution in small frequent sips.',
      'Light diet when tolerated; avoid dairy and spicy food initially.',
      'Seek care for blood in stool, high fever, or severe abdominal pain.',
    ],
    related: ['Food poisoning', 'Viral gastroenteritis'],
  },
  {
    keywords: ['joint pain', 'body aches', 'chills'],
    disease: 'Musculoskeletal / viral syndrome',
    specialist: 'Orthopedic or General Physician',
    severity: 'Low',
    urgency: 'Routine appointment unless joint is hot, swollen, and red.',
    precautions: [
      'Gentle movement and warm compress for muscle aches.',
      'Avoid strenuous activity until pain improves.',
      'Physiotherapy referral if pain persists beyond 2 weeks.',
    ],
    related: ['Viral myalgia', 'Arthritis flare'],
  },
  {
    keywords: ['rash', 'loss of taste', 'loss of smell'],
    disease: 'Dermatologic / systemic viral pattern',
    specialist: 'Dermatologist',
    severity: 'Low',
    urgency: 'Consult if rash spreads rapidly or involves mouth/eyes.',
    precautions: [
      'Avoid scratching; use bland moisturizer on itchy areas.',
      'Photograph rash progression for your clinician.',
      'Emergency care if rash with fever and stiff neck.',
    ],
    related: ['Allergic reaction', 'Viral exanthem'],
  },
  {
    keywords: ['chest pain', 'sweating', 'dizziness'],
    disease: 'Cardiovascular symptoms — needs assessment',
    specialist: 'Cardiologist',
    severity: 'High',
    urgency: 'Emergency evaluation strongly recommended.',
    precautions: [
      'Do not delay care for chest pressure with sweating.',
      'If prescribed nitroglycerin, use per your doctor’s instructions.',
    ],
    related: ['ACS', 'Arrhythmia'],
  },
];

const SYMPTOM_HINTS = {
  fever: 'Monitor temperature every 4–6 hours.',
  cough: 'Honey/lemon warm fluids may soothe (not for infants).',
  'difficulty breathing': 'Sit upright; use prescribed inhaler if you have asthma.',
};

export const fallbackPredict = (symptoms = []) => {
  const normalized = symptoms.map((s) => s.toLowerCase().trim());
  let best = null;
  let bestScore = 0;

  for (const rule of RULES) {
    const score = rule.keywords.filter((k) => normalized.some((s) => s.includes(k) || k.includes(s))).length;
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  const match = best || {
    disease: 'General medical consultation recommended',
    specialist: 'General Physician',
    severity: 'Low',
    urgency: 'Book an OPD visit to discuss your symptom pattern.',
    precautions: [
      'Keep a symptom diary (onset, severity, triggers).',
      'Stay hydrated and get adequate rest.',
      'Seek emergency care for sudden severe or worsening symptoms.',
    ],
    related: [],
  };

  const matchedHints = normalized
    .map((s) => ({ symptom: s, hint: SYMPTOM_HINTS[s] }))
    .filter((h) => h.hint);

  const confidencePct = bestScore > 0 ? Math.min(55 + bestScore * 12, 94) : 42;

  return {
    disease: match.disease,
    confidence: `${confidencePct}%`,
    severity: match.severity,
    specialist: match.specialist,
    specialistSuggested: match.specialist,
    urgency: match.urgency,
    precautions: match.precautions,
    relatedConditions: match.related || [],
    symptomInsights: matchedHints,
    analysisSteps: [
      'Normalized symptom profile',
      'Matched against clinical pattern library',
      'Assigned triage band and specialty routing',
    ],
    source: 'medicentral-rules-engine',
    disclaimer:
      'Educational triage assistant only — not a medical device or diagnosis. A licensed clinician must confirm any findings.',
  };
};

export default { fallbackPredict };
