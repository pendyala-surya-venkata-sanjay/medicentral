# Phase 3 — Admission → Ward → Surgery → Pharmacy → Discharge

## Success condition

End-to-end inpatient lifecycle: **Reception → PA → Doctor → Admit → Ward (vitals/nursing) → Surgery → Pharmacy → Billing → Digital discharge**, with live queues, Socket.IO, and timeline provenance — no repeated patient entry.

---

## 1. Admission workflow architecture

| Action | From | To | Role |
|--------|------|-----|------|
| `request_admission` | `IN_CONSULTATION` | `ADMISSION_REQUIRED` | doctor |
| `admit_patient` | `ADMISSION_REQUIRED` | `ADMITTED` | ward_manager |
| `emergency_admit` | `ADMISSION_REQUIRED` | `ADMITTED` | ward_manager (ICU flag) |

**API:** `POST /api/ops/doctor/visit/:id/request-admission`  
**Effects:** `visitType = IP`, optional ward name, emergency priority, ward queue enqueue, `patient:admitted` socket.

---

## 2. Ward management architecture

| Action | From | To |
|--------|------|-----|
| `start_observation` | `ADMITTED` | `UNDER_OBSERVATION` |
| `ready_for_surgery` | `UNDER_OBSERVATION` | `READY_FOR_SURGERY` |
| `request_surgery` | `UNDER_OBSERVATION` | `SURGERY_REQUIRED` |
| `forward_pharmacy` | `UNDER_OBSERVATION` | `PHARMACY_PENDING` |
| `return_observation` | `POST_SURGERY` | `UNDER_OBSERVATION` |

**Service:** `WardOpsService` — bed allocation, nursing notes  
**Vitals:** `VitalsService` — BP, pulse, SpO₂, temp, glucose, RR → `vitalsLog` + timeline + `vitals:updated` socket  
**API prefix:** `/api/ward-ops`  
**UI:** `WardDashboard` (`/ops/ward`)

---

## 3. Surgery workflow architecture

| Action | From | To |
|--------|------|-----|
| `confirm_surgery` | `READY_FOR_SURGERY` | `SURGERY_REQUIRED` |
| `schedule_surgery` | `SURGERY_REQUIRED` | `SURGERY_SCHEDULED` |
| `start_surgery` | `SURGERY_SCHEDULED` | `IN_SURGERY` |
| `complete_surgery` | `IN_SURGERY` | `POST_SURGERY` |
| `forward_pharmacy` | `POST_SURGERY` | `PHARMACY_PENDING` |

**Service:** `SurgeryOpsService` — OT plan, media upload to timeline  
**API prefix:** `/api/surgery-ops`  
**UI:** `SurgeryDashboard` (`/ops/surgery`)

---

## 4. Pharmacy workflow architecture

| Action | From | To |
|--------|------|-----|
| `dispense_medicines` | `PHARMACY_PENDING` | `PHARMACY_PENDING` (side effect) |
| `forward_to_billing` | `PHARMACY_PENDING` | `BILLING_PENDING` |

**Service:** `PharmacyOpsService` — loads `Prescription.medicines`, dispense, refreshes auto-bill  
**API prefix:** `/api/pharmacy-ops`  
**UI:** `PharmacyDashboard` (`/ops/pharmacy`)

---

## 5. Vitals system summary

| Field | Storage |
|-------|---------|
| Latest snapshot | `visit.vitals` |
| History | `visit.vitalsLog[]` |
| Timeline | `type: vitals` with provenance title |
| Realtime | `vitals:updated` on `/queues` namespace |

Recorded from **Ward dashboard** and visible on smart cards across ops views.

---

## 6. Realtime event map (Phase 3 additions)

| Event | When |
|-------|------|
| `patient:admitted` | Admit / emergency admit |
| `vitals:updated` | Vitals recorded |
| `surgery:scheduled` | OT scheduled |
| `surgery:completed` | Surgery complete |
| `pharmacy:ready` | Forward to pharmacy |
| `discharge:ready` | Ready for discharge summary |

Plus existing: `workflow:updated`, `queue:item:*`, `notification`.

---

## 7. Timeline enrichment summary

| Type | Examples |
|------|----------|
| `admission` | Admitted to Cardiology Ward, bed allocated |
| `vitals` | BP 140/90 · Pulse 78 |
| `surgery` | Surgery scheduled, media uploaded |
| `prescription` | Pharmacy dispensed medicines |
| `discharge` | Summary generated, patient discharged |
| `workflow` | Nursing notes, transitions |

Titles use **tenant + branch provenance** (e.g. *Apollo Hyderabad — Surgery Completed*).

---

## 8. New APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ops/doctor/visit/:id/request-admission` | Doctor requests IP admission |
| GET | `/api/ward-ops/visit/:id` | Ward context |
| PATCH | `/api/ward-ops/visit/:id/admission` | Allocate bed/ward/ICU |
| POST | `/api/ward-ops/visit/:id/vitals` | Record vitals |
| POST | `/api/ward-ops/visit/:id/nursing-note` | Nursing note |
| POST | `/api/ward-ops/visit/:id/transition` | Ward workflow actions |
| GET | `/api/surgery-ops/visit/:id` | Surgery context |
| PATCH | `/api/surgery-ops/visit/:id/plan` | OT plan |
| POST | `/api/surgery-ops/visit/:id/upload` | Surgery media |
| POST | `/api/surgery-ops/visit/:id/transition` | Surgery actions |
| GET | `/api/pharmacy-ops/visit/:id` | Pharmacy context |
| POST | `/api/pharmacy-ops/visit/:id/load-prescriptions` | Load Rx to queue |
| POST | `/api/pharmacy-ops/visit/:id/transition` | Dispense / billing |
| GET | `/api/discharge-ops/visit/:id` | Discharge context |
| POST | `/api/discharge-ops/visit/:id/generate-summary` | Digital summary |
| POST | `/api/discharge-ops/visit/:id/transition` | `discharge` |

**Queues:** `GET /api/queues/WARD|SURGERY|PHARMACY|PRINTING` (all queue types enabled).

---

## 9. New dashboards / screens

| Route | Dashboard | Role |
|-------|-----------|------|
| `/ops/ward` | `WardDashboard` | ward_manager |
| `/ops/surgery` | `SurgeryDashboard` | surgery_head |
| `/ops/pharmacy` | `PharmacyDashboard` | pharmacist |
| `/ops/discharge` | `DischargeDashboard` | printer_filing_officer |

**Updated:** `DoctorWorkflowDashboard` — Admit button; `OpsDashboardRouter`, `Sidebar`, `useRealtimeQueue`.

---

## 10. Technical debt remaining

| Item | Notes |
|------|-------|
| PDF export | Discharge uses text download; no PDF engine yet |
| ICU bed inventory | ICU flag only; no bed management ERP |
| OT scheduling conflicts | No resource calendar |
| Pharmacy inventory | Fulfillment workflow only |
| Nursing role | Uses `ward_manager` for vitals/notes |
| `dispense_medicines` same-state transition | Re-enqueues pharmacy queue item |
| Lab OP path still auto-forwards to billing | Independent of IP path |

---

## 11. Remaining enterprise gaps

- Insurance automation & TPA  
- Multi-branch staff routing  
- FHIR / external hospital APIs  
- ICU analytics & inventory ERP  
- AI clinical decision support  
- PostgreSQL / Prisma as primary DB  

---

## 12. Phase 4 recommendations

1. **Insurance engine** on billing cards  
2. **PDF discharge packet** + digital signature  
3. **Bed/ICU inventory** with occupancy map  
4. **Notification center** (inbox UI)  
5. **Consent-based cross-hospital viewer**  
6. **Prisma migration** for visits/queues  
7. **Multi-branch ops** staff switcher  

---

## Demo accounts (Phase 3)

| Email | Password | Role |
|-------|----------|------|
| doctor@demo.com | demo123 | doctor |
| ward@demo.com | demo123 | ward_manager |
| surgery@demo.com | demo123 | surgery_head |
| pharmacy@demo.com | demo123 | pharmacist |
| billing@demo.com | demo123 | billing_staff |
| discharge@demo.com | demo123 | printer_filing_officer |

**Seed:** `cd backend && npm run seed:foundation`

---

## E2E test path (inpatient)

1. Reception → PA → Doctor → **Admit** (Cardiology Ward)  
2. `ward@demo.com` → Admit → allocate bed → record vitals → under observation  
3. Request surgery → `surgery@demo.com` → schedule → start → complete  
4. Forward pharmacy → `pharmacy@demo.com` → load Rx → dispense → billing  
5. `billing@demo.com` → payment → ready discharge  
6. `discharge@demo.com` → generate summary → download → digital discharge  
7. `patient@demo.com` → timeline shows full journey with hospital names  

---

## Files reference

```
shared/constants/workflow.js
shared/constants/queues.js
backend/models/HospitalVisit.js
backend/modules/workflows/workflow.transitions.js
backend/modules/{ward,surgery,pharmacy,discharge,vitals}/
backend/controllers/{wardOps,surgeryOps,pharmacyOps,dischargeOps}Controller.js
frontend/src/pages/ops/{Ward,Surgery,Pharmacy,Discharge}Dashboard.jsx
docs/phase-3/PHASE-3-REPORT.md
```
