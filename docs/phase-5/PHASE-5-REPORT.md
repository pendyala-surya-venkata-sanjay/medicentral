# Phase 5 — AI + Smart Clinical Intelligence Layer

## Design principle

**Assist, never decide.** All intelligence is **deterministic and rules-based**, with `llmReady: true` contracts for future LLM integration. No fake confidence scores or autonomous diagnosis.

---

## 1. AI architecture summary

```
┌─────────────────────────────────────────────────────────┐
│              /api/intelligence (Phase 5)               │
├─────────────────────────────────────────────────────────┤
│ PatientSummaryService    → narrative + risk cards        │
│ TimelineIntelligence     → groups + pinned events        │
│ ClinicalAssistantService → allergy/vitals/lab alerts     │
│ AlertEngineService       → branch operational scan       │
│ SmartSearchService       → fuzzy multi-entity search     │
│ OperationalInsights      → queue/dept narratives         │
│ PlatformIntelligence     → network health score        │
│ DocumentIntelligence     → heuristic OCR metadata        │
└─────────────────────────────────────────────────────────┘
         │ uses                    │ preserves
         ▼                         ▼
 GlobalTimelineService      Workflows / Queues / Consent
```

---

## 2. Patient summary engine flow

1. Load patient profile, visits (all tenants), Rx, labs, global timeline  
2. Rule-based narrative: allergies, meds, chronic dx, surgery, admissions, abnormal labs, vitals  
3. `evaluateVitals()` — BP, pulse, SpO₂, temp, glucose thresholds  
4. Return `narrative`, `riskIndicators`, `cards`, `stats`, `disclaimer`  

**API:** `GET /api/intelligence/patient/:patientId/summary?visitId=`  

**UI:** `AIPatientSummaryCard` on Doctor + Patient dashboards  

---

## 3. Smart timeline architecture

- Groups events by type (lab, vitals, surgery, workflow, consent…)  
- Compressed summaries: “3 lab reports added”, “Cross-hospital transfer”  
- Pins critical: emergency, surgery, admission, consent  
- Uses `GlobalTimelineService` + provenance labels  

**API:** `GET /api/intelligence/patient/:patientId/timeline-smart`  

**UI:** `SmartTimeline` component  

---

## 4. OCR intelligence summary

**Heuristic layer** (`DocumentIntelligenceService`):
- Detect document type from filename/title/mime  
- Extract medicine/test name patterns  
- Auto-tag + suggest category  
- Stored on `PatientDocument.aiExtraction`  

**Hooks:**
- Patient upload auto-analyzes on create  
- `POST /api/intelligence/documents/analyze` for manual/ML text pass-through  

**Future:** Wire existing `POST /api/ocr/scan` ML service; map output into `ocrText` field for same analyzer.

---

## 5. Alert engine summary

| Type | Trigger |
|------|---------|
| `abnormal_vitals` | Vitals rules |
| `emergency` | priority urgent/critical |
| `billing` | BILLING_PENDING |
| `surgery` | scheduled >24h |
| `icu_risk` | inpatient.icu |
| `repeat_admission` | multiple active visits |
| `lab_pending` / `missing_report` | Clinical assistant |

**API:** `GET /api/intelligence/ops/alerts`  
**Realtime:** `smart:alert` Socket event  

---

## 6. Intelligent search architecture

Fuzzy/substring search across:
- Patients (ID, name, phone, Aadhaar)  
- Visits (department, workflow, token)  
- Prescriptions (diagnosis, medicines)  
- Lab reports  
- Hospitals, doctors  

Tenant-scoped for staff; global for `super_admin`.

**API:** `GET /api/intelligence/search?q=`  

**UI:** `IntelligentSearch` on Reception + extensible  

---

## 7. AI operational insights summary

Per-branch deterministic insights:
- Busiest department, longest queue, emergency load, billing bottleneck, surgery load  
- Narrative sentence for ops bar  
- Top branch alerts embedded  

**API:** `GET /api/intelligence/ops/insights`  

**UI:** `OpsInsightsBar` on Doctor + Reception  

---

## 8. Super admin AI enhancements

**API:** `GET /api/intelligence/platform/overview`  
Returns tenants + analytics + feed + **ai** block:
- Network health score (0–100 heuristic)  
- Patient movement heatmap by tenant  
- Cross-hospital traffic count  
- Emergency pattern %  
- AI narrative + recommendations  

**UI:** Enhanced `CommandCenter` health score card  

---

## 9. New APIs

| Method | Path |
|--------|------|
| GET | `/api/intelligence/patient/:patientId/summary` |
| GET | `/api/intelligence/patient/:patientId/timeline-smart` |
| GET | `/api/intelligence/patient/:patientId/assistant` |
| GET | `/api/intelligence/patient/:patientId/alerts` |
| GET | `/api/intelligence/search` |
| GET | `/api/intelligence/ops/insights` |
| GET | `/api/intelligence/ops/alerts` |
| GET | `/api/intelligence/platform/overview` |
| POST | `/api/intelligence/documents/analyze` |

All patient routes use `requirePatientAccess` (consent-aware).

---

## 10. New UI components

| Component | Location |
|-----------|----------|
| `AIPatientSummaryCard` | Doctor, Patient dashboards |
| `ClinicalAssistantPanel` | Doctor dashboard |
| `SmartTimeline` | Doctor, Patient dashboards |
| `OpsInsightsBar` | Doctor, Reception |
| `IntelligentSearch` | Reception |

---

## 11. Enterprise gaps remaining

- Production LLM summarization (OpenAI/Azure) behind feature flag  
- Real OCR → structured lab value extraction  
- Drug–drug interaction database (not substring rules)  
- ML triage / diagnosis (explicitly out of scope)  
- Patient-facing simplified timeline explanations  
- Alert acknowledgment + escalation workflows  

---

## 12. Phase 6 recommendations

1. **LLM adapter** — plug `PatientSummaryService.generateNarrative()` with guarded prompts  
2. **Insurance intelligence** — claim risk hints on billing cards  
3. **Predictive readmission** — rules + simple scoring from visit patterns  
4. **Voice/clinical note NLP** — structure consultation notes  
5. **Mobile push** for critical alerts  
6. **Audit trail** for AI-assisted views (compliance)  

---

## Success condition

- Doctors see **instant summary + assist alerts** without reading full timeline  
- Timelines are **grouped and pinned** for critical history  
- Ops sees **branch intelligence bar** + smart alerts  
- Super Admin sees **network health score + AI narrative**  
- Uploads get **auto-tagged** heuristic metadata  
- **No autonomous diagnosis** — disclaimer on all surfaces  

**Files:** `backend/modules/intelligence/`, `frontend/src/components/intelligence/`, `shared/constants/intelligence.js`
