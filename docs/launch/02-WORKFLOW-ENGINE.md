# Workflow Engine Design

## State model

Each `HospitalVisit` carries a `workflowState` aligned with `shared/constants/workflow.js` (e.g. reception, consultation, lab, surgery, ward, billing, discharge).

Transitions are enforced in controllers/services — not ad-hoc UI edits.

## Orchestration

- **WorkflowQueueItem** — department queues with `PENDING` / `IN_PROGRESS` / `COMPLETED`.
- **Handoffs** — completing a queue item can advance visit state and enqueue the next department.
- **Audit** — state changes logged to `AuditLog` for compliance and Command Center feed.

## Design guarantees

| Guarantee | Implementation |
|-----------|----------------|
| No orphan visits | States terminal only at `DISCHARGED` |
| Queue visibility | Ops dashboards poll + socket refresh |
| VIP / emergency | Priority flags on visit + presentation seed |

## Investor takeaway

MediCentral is not a static EMR form — it is an **operating system for hospital traffic**, suitable for multi-department coordination and live metrics.
