# Phase 0 — Architecture Foundation & Stabilization Report

**Date:** Phase 0 completion  
**Status:** Foundation laid; legacy features preserved  

---

## 1. Current architecture understanding

MediCentral remains a **working MERN prototype** (~107 JS/JSX files) with:

- **Frontend:** React 19 + Vite + Tailwind (role dashboards via `/dashboard`)
- **Backend:** Express 5 + MongoDB + Mongoose + JWT
- **ML:** FastAPI rules engine + OCR

Phase 0 **adds** a workflow-first layer **without removing** legacy routes. Runtime DB is still MongoDB; `prisma/schema.prisma` defines the PostgreSQL target.

**Dependency flow (simplified):**

```
frontend (axios) → /api/auth|records|timeline|hospital-ops|…  [legacy]
                 → /api/foundation/*                         [new metadata]
backend/server.js → connectDB → legacy routes
                  → foundationRoutes
                  → optional Socket.IO (ENABLE_SOCKET=true)
shared/constants → imported by backend modules + optional @shared in Vite
```

---

## 2. Refactored project structure

### Added (non-breaking)

| Path | Purpose |
|------|---------|
| `shared/` | Cross-cutting roles, workflow, queues, timeline constants |
| `prisma/` | Target relational schema |
| `backend/models/platform/` | Tenant, Branch, Staff, Queue, TimelineEvent, Consent |
| `backend/modules/` | workflows, queues, tenants, timeline, auth, notifications |
| `backend/routes/foundationRoutes.js` | Architecture API |
| `frontend/src/foundation/` | Constants + foundation API helpers |
| `docs/` | Architecture map, Phase 0 report, migration strategy |

### Preserved (unchanged paths)

- `backend/routes/*` (all legacy endpoints)
- `backend/controllers/*` (except `hospitalOpsController` enhanced)
- `backend/models/*` (legacy models)
- `frontend/src/pages/*`, `components/*`

---

## 3. Reusable modules list

| Module | Action | Notes |
|--------|--------|-------|
| JWT auth + register/login | **KEEP** | Extend with Staff profile |
| `MC-PT-*` / `MC-DR-*` IDs | **KEEP** | Global patient identity nucleus |
| `TreatmentTimeline` + aggregator | **KEEP** | Migrate to `TimelineEvent` writes |
| Patient upload center | **KEEP** | PA role owns uploads in Phase 2 |
| Prescriptions API/UI | **KEEP** | Attach to visit in Phase 1 |
| Upload middleware + protected files | **KEEP** | Move to S3 in Phase 4+ |
| Billing (GST, INR) | **KEEP** | Link to visit + billing queue |
| Hospital ops (visit/admit/discharge) | **REFACTOR** | Now sets `workflowState` + queue item |
| Doctor search/lookup | **KEEP** | Add consent gate later |
| OCR + symptom assistant | **KEEP** | Non-core demo features |
| OSM hospital locator | **KEEP** | Separate from tenant hospitals |
| `Hospital` Mongo model | **DEPRECATE LATER** | Tenants use `HospitalTenant` |

---

## 4. Technical debt report

| ID | Issue | Severity | Phase |
|----|-------|----------|-------|
| TD-1 | Dual DB strategy (Mongo runtime + Prisma contract) | Medium | 1 |
| TD-2 | Doctor can read any patient records (no `canAccessPatient` on records GET) | High | 1 |
| TD-3 | Legacy `User.role` vs `Staff.operationalRole` | Medium | 1 |
| TD-4 | Duplicate payment storage (`Billing.payments` + `Payment`) | Low | 2 |
| TD-5 | Timeline: aggregator vs `TimelineEvent` not unified | Medium | 1 |
| TD-6 | No automated tests | High | ongoing |
| TD-7 | Local disk uploads | Medium | 4 |
| TD-8 | `xss-clean` installed but unused | Low | 1 |
| TD-9 | Dead `Dashboard.jsx` page | Low | 2 |
| TD-10 | Global OPD token numbers (not per branch) | Medium | 2 |

---

## 5. New architecture map

See [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) and live endpoint:

`GET /api/foundation/architecture`

---

## 6. Workflow foundation summary

- **13 states** in `shared/constants/workflow.js`
- **Transition graph** in `backend/modules/workflows/workflow.transitions.js`
- **`WorkflowEngine`** validates role + state (`canTransition`)
- **`HospitalVisit.workflowState`** added (default `REGISTERED`)
- **Legacy `status`** preserved for existing UI
- **Visit create** maps legacy status → workflow state and enqueues reception/PA queue when tenants exist

---

## 7. Queue architecture summary

- **Queue types:** RECEPTION, PA, DOCTOR, LAB, WARD, SURGERY, PHARMACY, BILLING, PRINTING
- **Model:** `WorkflowQueueItem` (tenant + branch + visit + queueType + workflowState)
- **Service:** `QueueService.enqueueForVisit` / `listQueue`
- **Mapping:** `WORKFLOW_STATES_BY_QUEUE` in `shared/constants/queues.js`
- **Realtime:** Socket contracts in `socket.events.js`; server opt-in via `ENABLE_SOCKET=true`

---

## 8. Tenant foundation summary

**Seeded tenants (idempotent):**

| Tenant | Branches |
|--------|----------|
| Apollo Healthcare (`apollo`) | hyderabad, chennai |
| Yashoda Hospitals (`yashoda`) | bangalore, vijayawada |

**Scripts:**

- `SEED_FOUNDATION=true` on server start → `ensureFoundationSeeded()`
- `npm run seed:foundation` → tenants + demo Staff for `staff@demo.com`, `doctor@demo.com`

**API:** `GET /api/foundation/tenants` (authenticated)

---

## 9. RBAC foundation summary

- **Role catalog:** platform, tenant, operations, patient — `GET /api/foundation/roles`
- **`Staff` model** links `User` → `operationalRole` + tenant + branch
- **`attachStaffContext`** middleware sets `req.operationalRole`
- **Legacy map:** staff→receptionist, admin→tenant_admin, doctor→doctor, patient→patient
- **Permissions object** in `rbac.js` (expanded Phase 1)

---

## 10. Safe migration strategy

### Phase 0 (done)

- Add platform models alongside legacy
- Extend `HospitalVisit` with optional tenant/branch/workflow fields
- Dual timeline: legacy aggregator + `TimelineEvent` writes on visit create

### Phase 1 (recommended next)

1. Enforce `Staff` on all operational logins
2. `POST /api/workflow/transition` with `WorkflowEngine` + queue updates
3. Sync legacy timeline aggregator from `TimelineEvent`
4. Tenant-scope analytics queries
5. Fix records `canAccessPatient`

### Phase 2–4

- Role-specific queue dashboards (not forms)
- Consent flow (Yashoda → Apollo demo)
- PostgreSQL dual-write / migration
- Next.js frontend migration

See [`MIGRATION-STRATEGY.md`](./MIGRATION-STRATEGY.md).

---

## 11. Risks and blockers

| Risk | Mitigation |
|------|------------|
| Mongo + Prisma drift | Prisma as source of truth; migrate in Phase 1 |
| Breaking visit create if tenants missing | `getDefaultBranch()` fallback; ops work without seed |
| Staff not seeded | Document `npm run seed:foundation` |
| Socket port conflicts | Disabled by default |
| Scope creep into full dashboards | Phase 0 explicitly no new UI pages |

**Blockers for Phase 1:** None technical; need product sign-off on transition rules per role.

---

## 12. Recommended Phase 1 implementation order

1. **Workflow transition API** + audit log + timeline event on each transition  
2. **Reception quick onboard** (minimal fields) → `REGISTERED` → PA queue  
3. **PA dashboard queue** (upload/digitize) — move uploads off doctor UI  
4. **Doctor queue** (waiting/consultation only)  
5. **Tenant-scoped visit list** (branch header in API)  
6. **Consent request/approve** (foundation model → API)  
7. **Timeline read path** — merge `TimelineEvent` + legacy aggregator  
8. **RBAC enforcement** on records + cross-tenant reads  
9. **Socket live queue** (enable in dev)  
10. **Lab queue** (minimal list + forward)

---

## Phase 0 commands

```powershell
cd backend
npm install
# Set SEED_FOUNDATION=true in .env
npm run dev
npm run seed:foundation   # Staff profiles for demo users

# Verify foundation
curl http://localhost:5000/api/foundation/architecture
curl http://localhost:5000/api/foundation/workflow
```

---

## Dangerous areas (do not break)

- `backend/server.js` legacy route order
- `authController` registration rollback
- `uploadController` path traversal checks
- `timelineController` (patient-facing hero feature)

Phase 0 changes are **additive** except `hospitalOpsController.createVisit` enhancement (backward compatible).
