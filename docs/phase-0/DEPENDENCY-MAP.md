# MediCentral dependency map (Phase 0)

## Frontend → Backend

| Frontend | API | Backend module |
|----------|-----|----------------|
| Login/Register | `/api/auth/*` | authController, User, Patient, Doctor |
| PatientDashboard | `/api/records/patient`, `/api/stats/patient`, `/api/timeline/patient`, `/api/billing/patient`, `/api/lab/patient` | record, stats, timeline, billing, lab |
| PatientUploadCenter | `/api/patient-documents/*` | patientDocumentController |
| DoctorDashboard | `/api/patients/*`, `/api/records/*`, `/api/prescriptions/*`, `/api/voice/*`, `/api/surgery/*`, `/api/ocr/*` | patient, record, prescription, voice, surgery, ocr |
| HospitalDashboard | `/api/hospital-ops/*`, `/api/billing/*` | hospitalOpsController, billingController |
| TreatmentTimeline | `/api/timeline/patient/:id` | timelineController (aggregator) |
| Hospitals page | `/api/hospitals/nearby` | overpassHospitals (external) |
| Prediction | `/api/prediction/*` | predictionController → ml-service |
| foundation/api.js (new) | `/api/foundation/*` | foundationController |

## Backend internal

```
server.js
├── legacy routes → controllers → models (Patient, HospitalVisit, …)
└── foundationRoutes → foundationController → shared/constants

hospitalOpsController.createVisit
├── TenantService (default apollo/hyderabad)
├── WorkflowEngine
├── QueueService → WorkflowQueueItem
└── TimelineService → TimelineEvent

timelineController (legacy)
└── 11 parallel Mongo queries → merged JSON (unchanged)
```

## Shared package

```
shared/constants/
├── roles.js      → rbac.js, Staff model enum
├── workflow.js   → HospitalVisit.workflowState, WorkflowEngine
├── queues.js     → WorkflowQueueItem, QueueService
└── timeline.js   → TimelineEvent, ConsentAccess
```

## External services

- MongoDB Atlas / local
- ML service (`ML_SERVICE_URL`) — predict, OCR proxy
- OpenStreetMap Overpass — hospital locator only
