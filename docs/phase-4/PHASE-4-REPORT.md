# Phase 4 — Cross-Hospital Interoperability + Super Admin + Healthcare Network

## Hero feature

**One patient identity, many hospitals** — consent-driven sharing with full timeline provenance and tenant-scoped staff access.

**Architecture preserved:** `PATIENT = GLOBAL`, `VISIT = LOCAL`.

---

## 1. Interoperability architecture

```
┌─────────────┐     search      ┌──────────────────┐
│ Yashoda     │ ──────────────► │ Patient (global) │
│ Staff       │                 │ MC-PT-1001       │
└──────┬──────┘                 └────────┬─────────┘
       │ request consent                 │
       ▼                                 │ visits at
┌─────────────┐                          ▼
│ ConsentAccess│◄── approve ────  ┌─────────────┐
│ PENDING      │     (patient)    │ Apollo      │
└──────┬──────┘                  │ Timeline    │
       │ APPROVED                 └─────────────┘
       ▼
┌─────────────────────────────────────────────┐
│ GlobalTimelineService (scoped by consent)   │
└─────────────────────────────────────────────┘
```

**Modules:**
- `patient-access.service.js` — access evaluation, search, tenant history
- `global-timeline.service.js` — unified timeline with provenance labels
- `ecosystem.service.js` — network analytics + activity feed
- `interop.notifications.js` — Socket emits on consent lifecycle

---

## 2. Consent flow architecture

| Step | Actor | Action |
|------|-------|--------|
| 1 | Hospital B staff | `POST /api/consent/request` or interop search → request |
| 2 | System | Detect `grantingTenant` from patient visit history |
| 3 | Patient | Notification + timeline events (both tenants) |
| 4 | Patient | `POST /api/consent/:id/resolve` { approve, accessDuration } |
| 5 | Hospital B | `GET /api/interop/patient/:id/timeline` with scoped access |

**Scopes:** `timeline_only` | `reports_only` | `full_access`  
**Duration:** `temporary` (30d) | `permanent` (365d)  
**Status:** `PENDING` | `APPROVED` | `REJECTED` | `EXPIRED` | `REVOKED`

---

## 3. Tenant access architecture

| Access reason | Condition |
|---------------|-----------|
| `local_visit` | `HospitalVisit` exists for staff tenant |
| `consent` | Approved `ConsentAccess` for requesting tenant, not expired |
| `platform` | `super_admin` / platform role |
| `self` | Patient viewing own record |

**Guards:** `requirePatientAccess`, `PatientAccessService.evaluateAccess`, timeline + interop routes.

Staff **cannot** browse global patients without local visit or consent.

---

## 4. Super Admin architecture

**Route prefix:** `/api/platform`  
**Guard:** `requireSuperAdmin` (operationalRole `super_admin` or legacy `admin`)

**UI:** `CommandCenter` at `/platform` — tenant cards, live metrics, activity feed, global patient search + ecosystem timeline.

---

## 5. Global patient search flow

1. Super Admin or reception (`/interop/search`) enters Patient ID / name / phone / Aadhaar last 4  
2. `PatientAccessService.searchPatientsGlobal` returns matches + hospitals visited  
3. Staff sees `hasAccess` / `consentRequired` + `suggestedGrantingSlug`  
4. Request consent or open timeline if approved  
5. Super Admin: `/platform/patients/search` → `/platform/patients/:id/ecosystem` (full history)

---

## 6. Timeline continuity summary

- All sources merged: visits, labs, Rx, surgery, billing, workflow, consent, vitals  
- Structured `TimelineEvent` rows with `tenant` + `branch` populate  
- UI shows hospital chips + per-event hospital/branch badges  
- Cross-hospital consent events appear in patient global timeline  

---

## 7. Ecosystem analytics summary

| Metric | Source |
|--------|--------|
| Active visits | `HospitalVisit` by tenant |
| Surgeries today | Workflow states per tenant |
| Billing pending | `BILLING_PENDING` count |
| Cross-hospital shares | Approved consents across tenants |
| Department load | Aggregation on active visits |
| Activity feed | Recent consents + timeline events |

---

## 8. Realtime event map (Phase 4)

| Event | When |
|-------|------|
| `consent:requested` | Hospital requests access |
| `consent:approved` | Patient approves |
| `cross_hospital:access_granted` | Access active |
| `timeline:shared` | Timeline unlocked for requester |
| `tenant:activity` | Platform-wide activity ping |

---

## 9. New APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/consent/scopes` | Scope & duration catalog |
| GET | `/api/interop/search?q=` | Cross-hospital patient discovery |
| GET | `/api/interop/patient/:id/profile` | Ecosystem profile (guarded) |
| GET | `/api/interop/patient/:id/timeline` | Scoped global timeline |
| GET | `/api/platform/overview` | Tenants + analytics |
| GET | `/api/platform/analytics` | Network metrics |
| GET | `/api/platform/activity-feed` | Cross-hospital feed |
| GET | `/api/platform/patients/search?q=` | Global search |
| GET | `/api/platform/patients/:id/ecosystem` | Full ecosystem view |

**Enhanced:** `/api/timeline/patient`, `/api/consent/request`, `/api/consent/:id/resolve`, `/api/consent/check/:patientId`

---

## 10. New dashboards / screens

| Screen | Path | Users |
|--------|------|-------|
| Command Center | `/platform` | super_admin, admin |
| Interop Patient Search | Reception dashboard embed | receptionist+ |
| Consent panel (enhanced) | Patient dashboard | patient |

---

## 11. Remaining enterprise gaps

- Government / ABHA identity APIs  
- Blockchain audit trail  
- Insurance / TPA automation  
- FHIR export/import  
- Revoke consent UI + mid-access audit export  
- PDF timeline export for legal requests  

---

## 12. Phase 5 recommendations

1. **Insurance & billing network** — TPA eligibility across tenants  
2. **Consent revoke + access audit log** — compliance dashboard  
3. **FHIR R4 bundle export** per patient ecosystem  
4. **Patient mobile app** — push notifications for consent  
5. **Tenant admin portal** — per-hospital analytics (not only super admin)  
6. **PostgreSQL + Prisma** migration for consent and timeline at scale  

---

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| superadmin@demo.com | demo123 | super_admin (admin user) |
| patient@demo.com | demo123 | patient |
| staff@demo.com | demo123 | receptionist @ Apollo |
| staff@demo.com @ Yashoda | — | re-seed with Yashoda branch staff if needed |

**Cross-hospital demo:**
1. patient@demo.com visits Apollo (existing flow)  
2. Login Yashoda reception (seed branch) → Interop search MC-PT-1001 → Request access  
3. patient@demo.com approves consent  
4. Yashoda views timeline with Apollo history  
5. superadmin@demo.com → Command Center → global search  

**Seed:** `cd backend && npm run seed:foundation`

---

## Files reference

```
shared/constants/consent.js
backend/modules/interoperability/
backend/middleware/{requireSuperAdmin,requirePatientAccess}.js
backend/controllers/{interopController,platformController,consentController}.js
backend/routes/{interopRoutes,platformRoutes}.js
frontend/src/pages/platform/CommandCenter.jsx
frontend/src/components/ops/InteropPatientSearch.jsx
```
