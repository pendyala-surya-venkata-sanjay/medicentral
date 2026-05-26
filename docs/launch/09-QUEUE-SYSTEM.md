# Queue System Design

## WorkflowQueueItem

Each item represents work for a department:

- `department` — reception, pa, doctor, lab, billing, ward, surgery, pharmacy, discharge
- `status` — pending → in progress → completed
- Linked to `visitId` and tenant context

## UX contract

Ops dashboards show:

- Pending count (realtime + poll fallback)
- Claim / complete actions
- Visit context sidebar

## Health

`HealthService.detailed()` exposes `pendingItems` — Command Center Launch Health panel surfaces this.

## Failure modes prevented

- Completing a step without advancing state is blocked in service layer
- Presentation seed ensures non-empty queues for demos
