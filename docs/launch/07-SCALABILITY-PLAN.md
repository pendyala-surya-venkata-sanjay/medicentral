# Scalability Plan

## Current scale profile

- Single-region MongoDB with indexed queries on visits, queues, audits
- Stateless API instances behind load balancer
- Socket.io with sticky sessions or Redis adapter (recommended at 3+ nodes)

## Horizontal scaling

| Tier | Action |
|------|--------|
| API | Add instances; shared `JWT_SECRET`; Atlas connection pool |
| Realtime | Redis adapter for Socket.io |
| Uploads | Move `STORAGE_PROVIDER` to S3/Cloudinary |
| ML | Separate autoscaled ML service |

## Data growth

- Archive discharged visits to cold storage after N days
- Partition audit logs by month
- Timeline lazy-load (already used on patient hub)

## Remaining gaps

- No multi-region active-active yet
- No dedicated message bus (queues in MongoDB today)
- FHIR gateway not shipped

See [FINAL-PHASE-REPORT.md](./FINAL-PHASE-REPORT.md) §10 for launch score context.
