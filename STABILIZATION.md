# MediCentral — Critical Stabilization Report

> **Phase 0 (Architecture Foundation)** — See [`docs/phase-0/PHASE-0-REPORT.md`](docs/phase-0/PHASE-0-REPORT.md) for workflow/tenant/queue foundations, foundation API, and Phase 1 plan.


## Database reset (Phase 1)

```powershell
cd backend
npm run reset      # Clear all collections
npm run seed       # Clean demo data only
npm run reset:seed # Both in one command
```

**Removed:** All stale users, patients, US hardcoded hospitals, broken references.

**Seeded demo accounts** (password: `demo123`):

| Role | Email | Patient ID |
|------|-------|------------|
| Patient | patient@demo.com | **MC-PT-1001** |
| Doctor | doctor@demo.com | MC-DR-2001 |
| Hospital staff | staff@demo.com | — |

---

## Auth fixes (Phase 2)

- Unique **MC-PT-XXXX** / **MC-DR-XXXX** IDs with collision checks
- Registration rollback if profile creation fails
- Email normalized to lowercase
- Login/register return `patientId` / `doctorId` in JWT response
- Profile sync restores IDs after refresh

---

## Patient ID fixes (Phase 3)

- `GET /api/patients/lookup/:patientId` — doctor/staff patient details
- `normalizePatientId()` — accepts `1024` or `MC-PT-1024`
- Doctor dashboard shows **Active patient** card with ID
- Patient dashboard shows copyable Patient ID

---

## Hospitals — real data (Phase 5)

- **Removed** hardcoded US hospital seed from runtime
- **Added** OpenStreetMap **Overpass API** — `GET /api/hospitals/nearby?lat=&lng=`
- Works **worldwide** from browser geolocation
- Distance in km, emergency filter, keyword filter

---

## Verification checklist

- [x] Register patient → receives Patient ID
- [x] Login patient → dashboard shows MC-PT-XXXX
- [x] Doctor searches MC-PT-1001 → patient found
- [x] Doctor creates record → persists
- [x] Hospitals load from real OSM data
- [x] Database reset + reseed scripts

---

## Run

```powershell
cd backend && npm run dev
cd frontend && npm run dev
```

http://localhost:5173 — Login with demo accounts above.
