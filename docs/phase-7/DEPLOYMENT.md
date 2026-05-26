# Production Deployment Guide (Phase 7)

## Prerequisites

- Node 18+, MongoDB 7+
- Set variables from `backend/.env.example`
- `JWT_SECRET` and `JWT_REFRESH_SECRET` ≥ 32 characters
- `CORS_ORIGIN` = exact frontend origin(s)
- `TRUST_PROXY=true` behind NGINX/load balancer

## Health endpoints

| Endpoint | Access | Purpose |
|----------|--------|---------|
| `GET /health` | Public | Liveness |
| `GET /health/ready` | Public | Readiness (DB connected) |
| `GET /health/detailed` | Super Admin JWT | Queue/socket/audit/upload checks |
| `GET /health/launch` | Public | Launch metrics summary |
| `GET /api/platform/system-health` | Super Admin | Command Center + Launch Health panel |

## Docker Compose

```bash
docker compose up -d --build
```

Backend healthcheck hits `/health/ready`. WebSocket path `/socket.io` must be proxied (see `deploy/nginx.conf.example`).

## NGINX

Copy `deploy/nginx.conf.example` and enable:

- `client_max_body_size` ≥ upload limit
- WebSocket upgrade headers for `/socket.io/`
- `X-Forwarded-*` headers for audit IP + rate limits

## Security checklist

- [ ] Rotate JWT secrets per environment
- [ ] `STRICT_TENANT_SCOPE=true` in production
- [ ] Disable `SEED_DEMO_DATA`
- [ ] TLS termination at load balancer
- [ ] Restrict MongoDB network access
- [ ] Schedule `scripts/backup-export.js` + `mongodump`
