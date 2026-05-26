# Deployment Guide

## Targets

| Component | Recommended | Config |
|-----------|-------------|--------|
| Frontend | Vercel / Cloudflare Pages | Root `vercel.json`, `VITE_API_URL` |
| API | Render / Railway / AWS | `render.yaml`, `docker-compose.prod.yml` |
| Database | MongoDB Atlas | `MONGO_URI` |
| ML | Render Docker / sidecar | `ML_SERVICE_URL` |
| Uploads | Local disk → S3 / Cloudinary | `STORAGE_PROVIDER` |

## Files

- `vercel.json` — SPA build + rewrite
- `render.yaml` — API + ML blueprint
- `docker-compose.prod.yml` — self-hosted production stack
- `.env.production.example` — full variable template

## Health checks

| Endpoint | Use |
|----------|-----|
| `GET /health` | Liveness |
| `GET /health/ready` | Load balancer readiness |
| `GET /health/launch` | Launch metrics (public summary) |
| `GET /api/platform/system-health` | Command Center (super admin JWT) |

## WebSocket production

Proxy `/socket.io` with upgrade headers — see `deploy/nginx.conf.example`.

Set `TRUST_PROXY=true` behind NGINX or cloud load balancers.

## Seed for demos

```bash
cd backend
npm run seed:launch    # foundation + demo + presentation
```

Disable `SEED_DEMO_DATA` and `PRESENTATION_MODE` in real production.
