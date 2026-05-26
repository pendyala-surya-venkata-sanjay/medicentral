# Prisma schema (target architecture)

Phase 0 defines the **PostgreSQL contract** for MediCentral OS. The running API still uses **MongoDB + Mongoose** until a phased migration (see `docs/phase-0/MIGRATION-STRATEGY.md`).

```bash
# When DATABASE_URL is configured (Phase 1+):
npx prisma generate
npx prisma migrate dev
```

Do not run migrations against production until the dual-write strategy is in place.
