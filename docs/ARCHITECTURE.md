# MediCentral OS — Architecture Map (Phase 0)

## Target layout

```
medicentral/
├── frontend/          # React (Vite) — migrating to Next.js in later phases
├── backend/
│   ├── routes/        # Legacy HTTP routes (preserved)
│   ├── controllers/   # Legacy controllers + foundationController
│   ├── models/        # Legacy Mongoose + platform/ foundation models
│   ├── modules/       # Workflow-first foundation (NEW)
│   ├── middleware/
│   └── scripts/
├── shared/            # Roles, workflow states, queue types, timeline types
├── prisma/            # PostgreSQL target schema (contract)
└── docs/
```

## Four layers

| Layer | Phase 0 status | Location |
|-------|----------------|----------|
| Patient Record | Timeline aggregator + `TimelineEvent` model | `timelineController`, `modules/timeline/` |
| Workflow Engine | States + transitions + `WorkflowEngine` | `modules/workflows/` |
| Queue System | `WorkflowQueueItem` + `QueueService` | `modules/queues/` |
| Tenant Ecosystem | Apollo + Yashoda seed | `modules/tenants/` |

## API surfaces

| Prefix | Purpose |
|--------|---------|
| `/api/*` | Legacy working APIs (auth, records, ops, …) |
| `/api/foundation/*` | Architecture metadata & tenant list |

## Core principle

**PATIENT = GLOBAL** · **VISIT = LOCAL** (`HospitalVisit` + `workflowState`)
