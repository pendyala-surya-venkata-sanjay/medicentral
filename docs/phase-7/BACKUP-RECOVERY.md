# Backup & Recovery Architecture (Phase 7)

## Strategy

MediCentral uses **MongoDB** for operational data and **local disk** (`backend/uploads/`) for clinical files. Phase 7 defines procedures and hooks — not managed cloud backup yet.

## Backup components

| Asset | Method | Frequency (recommended) |
|-------|--------|-------------------------|
| MongoDB | `mongodump` / Atlas continuous backup | Daily + before releases |
| Uploads volume | Filesystem snapshot or `rsync` | Daily |
| Audit logs | Included in Mongo dump | Daily (immutable collection) |
| Config/secrets | Secret manager (not in repo) | On change |

## Hook script

```bash
cd backend
node scripts/backup-export.js
```

Writes `backend/backups/manifest-<timestamp>.json` with collection counts and upload folder listing. Use as pre-flight check before `mongodump`.

## Recovery procedure

1. Stop API containers (`docker compose down backend`)
2. Restore Mongo: `mongorestore --drop --uri="$MONGO_URI" ./dump/medicentral`
3. Restore uploads volume to `backend/uploads`
4. Verify `GET /health/ready` returns `{ ready: true }`
5. Super Admin: `GET /api/platform/system-health`
6. Spot-check one workflow transition + audit log entry

## RPO / RTO targets (planning)

- **RPO:** 24 hours (daily backups) — tighten with Atlas PITR in production
- **RTO:** 2–4 hours for full stack restore

## Upload persistence

- Docker volume: `backend_uploads` in `docker-compose.yml`
- Production: mount persistent block storage; never bake uploads into image layers
