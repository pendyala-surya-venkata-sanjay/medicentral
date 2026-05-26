# Safe migration strategy — Mongo legacy → MediCentral OS

## Guiding rules

1. **Never big-bang replace** working auth, uploads, or patient timeline in one PR.
2. **HospitalVisit** is the spine — attach new features to visits first.
3. **Write twice, read once** during transition (legacy + `TimelineEvent`).
4. **Feature flags:** `SEED_FOUNDATION`, `ENABLE_SOCKET`, future `USE_WORKFLOW_API`.

## Stage A — Foundation (Phase 0) ✅

- Platform Mongoose models
- Shared constants
- Prisma schema as contract
- Foundation API
- Visit create writes `workflowState` + optional queue/timeline

## Stage B — Orchestration (Phase 1)

- All new operational actions go through `WorkflowEngine.transition()`
- Queue items auto-complete on forward
- Legacy `status` synced from `workflowState` for old UI
- Staff required for hospital ops routes

## Stage C — Timeline unification (Phase 1–2)

- On each clinical/financial action → `TimelineService.appendEvent`
- `GET /api/timeline` reads `TimelineEvent` first, falls back to aggregator
- Backfill script: legacy documents → `TimelineEvent`

## Stage D — Multi-tenant enforcement (Phase 2)

- `req.tenant` / `req.branch` from Staff or headers
- Analytics filtered by tenant
- Doctor access requires active visit or consent

## Stage E — PostgreSQL (Phase 3+)

- Prisma migrate
- Dual-write worker or migration script from Mongo
- Retire Mongoose when parity tests pass

## Rollback plan

- Foundation fields on `HospitalVisit` are optional — old visits work
- Remove `SEED_FOUNDATION` if tenant seed causes issues
- Legacy routes untouched — disable foundation routes only if needed
